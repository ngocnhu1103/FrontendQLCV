<template>
  <div class="project-container">
    <div class="page-header">
      <div class="header-title">
        <h1>Quản lý dự án</h1>
        <p>Hệ thống theo dõi và phân quyền thành viên dự án Teamsync</p>
      </div>
      <button class="btn-primary" @click="openAddProjectModal">
        <span class="icon">+</span> Tạo dự án mới
      </button>
    </div>

    <div class="filter-bar">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input v-model="searchQuery" type="text" placeholder="Tìm kiếm theo tên hoặc mã dự án..." />
      </div>
      <div class="filter-actions">
        <select v-model="statusFilter" class="select-filter">
          <option :value="1">Dự án đang hoạt động</option>
          <option :value="0">Dự án đã hoàn thành / Lưu trữ</option>
        </select>
      </div>
    </div>

    <div v-if="pending" class="loading-state">
      <div class="spinner"></div> Đang tải danh sách dự án...
    </div>

    <div v-else-if="filteredProjects.length > 0" class="project-grid">
      <div 
        v-for="project in filteredProjects" 
        :key="project.Id" 
        class="project-card"
      >
        <div class="project-card-header">
          <div>
            <span class="project-code">{{ project.ProjectCode }}</span>
            <h3 class="project-name">{{ project.ProjectName }}</h3>
          </div>
        </div>
        
        <p class="project-desc">{{ project.Description || 'Không có mô tả cho dự án này.' }}</p>
        
        <div class="project-dates">
          <span>📅 Bắt đầu: {{ formatDate(project.StartDate) }}</span>
          <span>🏁 Kết thúc: {{ formatDate(project.EndDate) }}</span>
        </div>

        <div class="project-card-footer">
          <div class="left-actions">
            <button class="btn-secondary" @click="openMemberModal(project)">
              👥 Thành viên ({{ getMemberCount(project) }})
            </button>
            <button class="btn-info" @click="goToProjectDetail(project.Id)">
              👁️ Xem chi tiết
            </button>
          </div>
          <div class="action-buttons" v-if="project.IsActive === 1 || project.IsActive === true">
            <button class="btn-action edit" @click="openEditProjectModal(project)" title="Sửa thông tin">📝</button>
            <button class="btn-action delete" @click="handleDeleteProject(project.Id)" title="Xóa dự án">🗑️</button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      ❌ Không tìm thấy dự án nào phù hợp với bộ lọc hiện tại.
    </div>

    <div v-if="isProjectModalOpen" class="modal-overlay" @click.self="closeProjectModal">
      <div class="modal-box">
        <div class="modal-header">
          <h2>{{ isEditMode ? 'Cập nhật thông tin dự án' : 'Tạo dự án mới' }}</h2>
          <button class="close-modal-btn" @click="closeProjectModal">×</button>
        </div>
        <form @submit.prevent="handleSubmitProject">
          <div class="modal-body">
            <div class="form-group">
              <label>Tên dự án <span class="required">*</span></label>
              <input v-model="projectForm.ProjectName" type="text" placeholder="Nhập tên dự án" required />
            </div>
            <div class="form-group">
              <label>Mô tả dự án</label>
              <textarea v-model="projectForm.Description" rows="3" placeholder="Nhập mô tả chi tiết dự án..."></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Ngày bắt đầu <span class="required">*</span></label>
                <input v-model="projectForm.StartDate" type="date" required />
              </div>
              <div class="form-group">
                <label>Ngày kết thúc <span class="required">*</span></label>
                <input v-model="projectForm.EndDate" type="date" required />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-cancel" @click="closeProjectModal">Hủy</button>
            <button type="submit" class="btn-submit" :disabled="submitting">
              {{ submitting ? 'Đang xử lý...' : (isEditMode ? 'Cập nhật' : 'Lưu lại') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="isMemberModalOpen" class="modal-overlay" @click.self="closeMemberModal">
      <div class="modal-box large">
        <div class="modal-header">
          <h2>Thành viên dự án: {{ currentProject?.ProjectName }}</h2>
          <button class="close-modal-btn" @click="closeMemberModal">×</button>
        </div>
        <div class="modal-body">
          <div class="add-member-section">
            <h3>Cập nhật quyền thành viên</h3>
            <div class="member-form-row">
              <div class="form-group spec">
                <label>Chọn Nhân viên <span class="required">*</span></label>
                <select v-model="memberForm.UserId" class="select-form" :disabled="isEditMemberMode">
                  <option value="">-- Chọn nhân viên --</option>
                  <option v-for="u in systemUsers" :key="u.Id" :value="u.Id">
                    {{ u.FullName }} (ID: {{ u.Id }})
                  </option>
                </select>
              </div>
              <div class="form-group spec">
                <label>Chọn vai trò trong dự án <span class="required">*</span></label>
                <div class="checkbox-group">
                  <label v-for="role in systemRoles" :key="role.Id" class="checkbox-label">
                    <input type="checkbox" :value="role.Id" v-model="memberForm.RoleIds" />
                    {{ role.RoleName || role.Name }}
                  </label>
                </div>
              </div>
              <button type="button" class="btn-primary align-bottom" @click="handleSaveMember" :disabled="submitting">
                🎯 Lưu phân quyền
              </button>
            </div>
          </div>

          <div class="member-list-section">
            <h3>Danh sách thành viên hiện tại</h3>
            <table class="member-table">
              <thead>
                <tr>
                  <th>Mã & Tên nhân viên</th>
                  <th>Các vai trò được giao</th>
                  <th style="width: 100px;">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="m in currentProjectMembers" :key="m.UserId">
                  <td>
                    <div class="member-info">
                      <span class="member-name">{{ m.FullName }}</span>
                      <span class="member-id">ID: #{{ m.UserId }}</span>
                    </div>
                  </td>
                  <td>
                    <span v-for="rId in m.Roles" :key="rId" class="role-badge">
                      {{ getRoleName(rId) }}
                    </span>
                  </td>
                  <td>
                    <button class="btn-action edit" @click="editMemberPermissions(m)" title="Sửa quyền">📝 Sửa quyền</button>
                  </td>
                </tr>
                <tr v-if="currentProjectMembers.length === 0">
                  <td colspan="3" class="text-center text-muted" style="padding: 20px;">Chưa có thành viên nào trong dự án này.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

definePageMeta({
  layout: 'default'
})

const { token, user: loggedInUser } = useAuth()
const config = useRuntimeConfig()
const apiBase = config.public.apiBase || 'http://localhost:5000/api'

const projectList = ref([])       
const systemUsers = ref([])       
const systemRoles = ref([])       
const pending = ref(false)
const submitting = ref(false)
const searchQuery = ref('')
const statusFilter = ref(1) 

const isProjectModalOpen = ref(false)
const isMemberModalOpen = ref(false)
const isEditMode = ref(false)
const isEditMemberMode = ref(false)
const currentProject = ref(null)

const projectForm = ref({ ProjectName: '', Description: '', StartDate: '', EndDate: '' })
const memberForm = ref({ UserId: '', RoleIds: [] })

const goToProjectDetail = (projectId) => {
  return navigateTo('/projects/' + projectId)
}

const fetchProjectsAndCategories = async () => {
  pending.value = true
  try {
    const [projectsRes, usersRes, rolesRes] = await Promise.all([
      $fetch('/projects', { baseURL: apiBase, headers: { Authorization: `Bearer ${token.value}` } }),
      $fetch('/users', { baseURL: apiBase, headers: { Authorization: `Bearer ${token.value}` } }),
      $fetch('/roles', { baseURL: apiBase, headers: { Authorization: `Bearer ${token.value}` } })
    ])

    const allProjects = projectsRes?.data || projectsRes || []
    systemUsers.value = usersRes?.data || usersRes || []
    systemRoles.value = rolesRes?.data || rolesRes || []

    const uniqueProjects = []
    const seenIds = new Set()
    for (const p of allProjects) {
      if (!seenIds.has(p.Id)) {
        seenIds.add(p.Id)
        uniqueProjects.push(p)
      }
    }
    projectList.value = uniqueProjects
  } catch (error) {
    console.error('Lỗi load danh sách:', error)
  } finally {
    pending.value = false
  }
}

const filteredProjects = computed(() => {
  return projectList.value.filter(p => {
    const isProjectActive = p.IsActive === true || Number(p.IsActive) === 1
    const matchesStatus = (statusFilter.value === 1 && isProjectActive) || (statusFilter.value === 0 && !isProjectActive)
    
    const search = searchQuery.value.toLowerCase().trim()
    const matchesSearch = !search || 
                          (p.ProjectName || '').toLowerCase().includes(search) || 
                          (p.ProjectCode || '').toLowerCase().includes(search)
    return matchesStatus && matchesSearch
  })
})

// ⭐ ĐÃ CHỈNH SỬA ĐỒNG BỘ: Đọc chính xác cấu trúc 'members' và 'user' chữ thường từ backend
const currentProjectMembers = computed(() => {
  if (!currentProject.value) return []
  const membersData = currentProject.value.members || currentProject.value.ProjectMembers || []
  const grouped = {}
  
  membersData.forEach(m => {
    if (m.IsActive === true || Number(m.IsActive) === 1) {
      if (!grouped[m.UserId]) {
        const nestedUser = m.user || m.User
        grouped[m.UserId] = {
          UserId: m.UserId,
          FullName: nestedUser?.FullName || `User ID #${m.UserId}`,
          Roles: []
        }
      }
      if (!grouped[m.UserId].Roles.includes(m.RoleInProjectId)) {
        grouped[m.UserId].Roles.push(m.RoleInProjectId)
      }
    }
  })
  return Object.values(grouped)
})

// ⭐ ĐÃ CHỈNH SỬA ĐỒNG BỘ: Đếm chuẩn số lượng từ thuộc tính 'members'
const getMemberCount = (project) => {
  if (!project) return 0
  const membersData = project.members || project.ProjectMembers || []
  const activeMembers = membersData.filter(m => m.IsActive === true || Number(m.IsActive) === 1)
  return [...new Set(activeMembers.map(m => m.UserId))].length
}

const getRoleName = (roleId) => {
  const role = systemRoles.value.find(r => r.Id === roleId)
  return role?.RoleName || role?.Name || `Vai trò ${roleId}`
}

const generateProjectCode = (name) => {
  if (!name) return ''
  let code = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  code = code.replace(/đ/g, "d").replace(/[^a-z0-9]/g, "")
  let counter = 0
  let finalCode = code.toUpperCase()
  while (projectList.value.some(p => p.ProjectCode === finalCode)) {
    counter++
    finalCode = `${code.toUpperCase()}${counter}`
  }
  return finalCode
}

const openAddProjectModal = () => {
  isEditMode.value = false
  projectForm.value = { ProjectName: '', Description: '', StartDate: '', EndDate: '' }
  isProjectModalOpen.value = true
}

const openEditProjectModal = (project) => {
  isEditMode.value = true
  currentProject.value = project
  projectForm.value = {
    ProjectName: project.ProjectName,
    Description: project.Description,
    StartDate: project.StartDate ? new Date(project.StartDate).toISOString().split('T')[0] : '',
    EndDate: project.EndDate ? new Date(project.EndDate).toISOString().split('T')[0] : ''
  }
  isProjectModalOpen.value = true
}

const closeProjectModal = () => { isProjectModalOpen.value = false }

const handleSubmitProject = async () => {
  submitting.value = true
  const currentUserId = loggedInUser.value?.Id || 1
  const now = new Date().toISOString()

  try {
    if (isEditMode.value) {
      await $fetch(`/projects/${currentProject.value.Id}`, {
        baseURL: apiBase,
        method: 'PUT',
        headers: { Authorization: `Bearer ${token.value}` },
        body: {
          ProjectName: projectForm.value.ProjectName,
          Description: projectForm.value.Description,
          StartDate: projectForm.value.StartDate,
          EndDate: projectForm.value.EndDate
        }
      })
      alert('Cập nhật thông tin dự án thành công!')
    } else {
      const generatedCode = generateProjectCode(projectForm.value.ProjectName)
      await $fetch('/projects', {
        baseURL: apiBase,
        method: 'POST',
        headers: { Authorization: `Bearer ${token.value}` },
        body: {
          ProjectName: projectForm.value.ProjectName,
          ProjectCode: generatedCode,
          Description: projectForm.value.Description,
          StartDate: projectForm.value.StartDate,
          EndDate: projectForm.value.EndDate,
          StatusId: 1,
          IsActive: 1,
          CreatedBy: currentUserId,
          CreatedAt: now
        }
      })
      alert(`Khởi tạo dự án thành công! Mã dự án: ${generatedCode}`)
    }
    closeProjectModal()
    fetchProjectsAndCategories()
  } catch (error) {
    alert('Có lỗi xảy ra trong quá trình xử lý!')
  } finally {
    submitting.value = false
  }
}

const handleDeleteProject = async (id) => {
  if (confirm('Bạn có chắc chắn muốn xóa dự án này?')) {
    try {
      await $fetch(`/projects/${id}`, {
        baseURL: apiBase,
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token.value}` }
      })
      alert('Đã xóa dự án thành công!')
      fetchProjectsAndCategories()
    } catch (error) {
      alert('Không thể thực hiện xóa dự án!')
    }
  }
}

const openMemberModal = (project) => {
  currentProject.value = project
  isEditMemberMode.value = false
  memberForm.value = { UserId: '', RoleIds: [] }
  isMemberModalOpen.value = true
}
const closeMemberModal = () => { isMemberModalOpen.value = false }

const editMemberPermissions = (member) => {
  isEditMemberMode.value = true
  memberForm.value = {
    UserId: member.UserId,
    RoleIds: [...member.Roles]
  }
}

const handleSaveMember = async () => {
  if (!memberForm.value.UserId || memberForm.value.RoleIds.length === 0) {
    alert('Vui lòng chọn nhân viên và tích chọn tối thiểu 1 vai trò!')
    return
  }
  submitting.value = true
  try {
    if (isEditMemberMode.value) {
      await $fetch(`/projects/members/${currentProject.value.Id}/${memberForm.value.UserId}`, {
        baseURL: apiBase,
        method: 'PUT',
        headers: { Authorization: `Bearer ${token.value}` },
        body: { RoleIds: memberForm.value.RoleIds }
      })
      alert('Cập nhật phân quyền thành viên thành công!')
    } else {
      await $fetch('/projects/members', {
        baseURL: apiBase,
        method: 'POST',
        headers: { Authorization: `Bearer ${token.value}` },
        body: {
          ProjectId: currentProject.value.Id,
          UserId: memberForm.value.UserId,
          RoleIds: memberForm.value.RoleIds
        }
      })
      alert('Thêm thành viên vào dự án thành công!')
    }
    isEditMemberMode.value = false
    memberForm.value = { UserId: '', RoleIds: [] }
    await fetchProjectsAndCategories()
    const updatedProj = projectList.value.find(p => p.Id === currentProject.value.Id)
    if (updatedProj) currentProject.value = updatedProj
  } catch (error) {
    alert('Lỗi khi thao tác cập nhật quyền thành viên!')
  } finally {
    submitting.value = false
  }
}

const formatDate = (dStr) => {
  if (!dStr) return 'Chưa thiết lập'
  return new Date(dStr).toLocaleDateString('vi-VN')
}

onMounted(() => {
  fetchProjectsAndCategories()
})
</script>

<style scoped>
.project-container { padding: 4px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.header-title h1 { font-size: 22px; font-weight: 700; color: #1e293b; margin: 0; }
.header-title p { font-size: 13px; color: #64748b; margin-top: 4px; }
.btn-primary { background-color: #2563eb; color: white; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 13.5px; display: flex; align-items: center; gap: 6px; }
.btn-primary:hover { background-color: #1d4ed8; }
.left-actions { display: flex; gap: 8px; }
.btn-secondary { background-color: #f8fafc; color: #334155; border: 1px solid #cbd5e1; padding: 6px 12px; border-radius: 6px; font-size: 12.5px; font-weight: 600; cursor: pointer; }
.btn-secondary:hover { background-color: #f1f5f9; }
.btn-info { background-color: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; padding: 6px 12px; border-radius: 6px; font-size: 12.5px; font-weight: 600; cursor: pointer; }
.btn-info:hover { background-color: #dcfce7; }
.filter-bar { display: flex; justify-content: space-between; background: white; padding: 12px 16px; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 20px; }
.search-box { display: flex; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 12px; width: 360px; }
.search-box input { border: none; background: transparent; outline: none; margin-left: 8px; width: 100%; font-size: 14px; }
.select-filter, .select-form { border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; font-size: 13.5px; background-color: white; outline: none; min-width: 180px; }
.project-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
.project-card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between; transition: transform 0.2s ease, box-shadow 0.2s ease; }
.project-card:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); border-color: #cbd5e1; }
.project-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
.project-code { font-size: 11px; background: #f0fdf4; color: #16a34a; padding: 2px 6px; border-radius: 4px; font-weight: 700; display: inline-block; }
.project-name { margin: 6px 0 0; font-size: 16.5px; font-weight: 700; color: #1e293b; line-height: 1.4; }
.project-desc { font-size: 13.5px; color: #64748b; line-height: 1.5; margin: 0 0 14px; min-height: 42px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.project-dates { font-size: 12px; color: #475569; display: flex; justify-content: space-between; background: #f8fafc; padding: 8px 10px; border-radius: 6px; margin-bottom: 14px; border: 1px solid #f1f5f9; }
.project-card-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 12px; margin-top: auto; }
.action-buttons { display: flex; gap: 6px; }
.btn-action { background: none; border: none; cursor: pointer; font-size: 14px; padding: 4px 6px; border-radius: 4px; border: 1px solid transparent; }
.btn-action:hover { background-color: #f1f5f9; border-color: #cbd5e1; }
.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.4); display: flex; justify-content: center; align-items: center; z-index: 999; }
.modal-box { background: white; width: 520px; max-width: 95%; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); overflow: hidden; animation: zoomIn 0.15s ease-out; }
.modal-box.large { width: 800px; }
.modal-header { padding: 16px 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
.modal-header h2 { font-size: 16px; font-weight: 700; color: #1e293b; margin: 0; }
.close-modal-btn { background: none; border: none; font-size: 22px; color: #94a3b8; cursor: pointer; }
.modal-body { padding: 20px; max-height: 70vh; overflow-y: auto; }
.form-group { margin-bottom: 14px; display: flex; flex-direction: column; }
.form-group.spec { flex: 1; min-width: 180px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
label { font-size: 12.5px; font-weight: 600; color: #475569; margin-bottom: 4px; }
.required { color: #ef4444; }
textarea { padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; outline: none; font-size: 13.5px; font-family: inherit; resize: none; }
input[type="text"], input[type="date"] { padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13.5px; outline: none; background-color: white; }
.modal-footer { padding: 14px 20px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 10px; }
.btn-cancel { background: white; border: 1px solid #cbd5e1; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; color: #475569; font-size: 13px; }
.btn-submit { background: #2563eb; border: none; padding: 8px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; color: white; font-size: 13px; }
.checkbox-group { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 8px; border: 1px solid #cbd5e1; padding: 8px 12px; border-radius: 6px; max-height: 100px; overflow-y: auto; background-color: #f8fafc; }
.checkbox-label { display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer; color: #334155; }
.member-form-row { display: flex; gap: 12px; align-items: flex-end; background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px dashed #cbd5e1; margin-bottom: 20px; }
.align-bottom { height: 36px; padding: 0 14px; font-size: 13px; }
.member-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13.5px; }
.member-table th { background: #f8fafc; padding: 10px 12px; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
.member-table td { padding: 12px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
.member-info { display: flex; flex-direction: column; }
.member-name { font-weight: 600; color: #1e293b; }
.member-id { font-size: 11px; color: #94a3b8; margin-top: 2px; }
.role-badge { display: inline-block; background: #f3e8ff; color: #6b21a8; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; margin-right: 4px; border: 1px solid #e9d5ff; }
.loading-state, .empty-state { text-align: center; padding: 40px; color: #64748b; font-size: 14px; }
.spinner { width: 20px; height: 20px; border: 2px solid #cbd5e1; border-top-color: #2563eb; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; margin-right: 8px; vertical-align: middle; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes zoomIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
</style>