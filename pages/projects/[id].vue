<template>
  <div class="project-detail-container">
    <!-- Thanh điều hướng quay lại -->
    <div class="back-nav">
      <button class="btn-back" @click="goBack">
        ⬅️ Quay lại danh sách dự án
      </button>
    </div>

    <div v-if="pending" class="loading-state">
      <div class="spinner"></div> Đang tải thông tin chi tiết dự án...
    </div>

    <div v-else-if="project" class="detail-content">
      
      <!-- ================= PHẦN TRÊN: CHIA ĐÔI THÔNG TIN DỰ ÁN VÀ THÀNH VIÊN ================= -->
      <div class="top-split-panel">
        
        <!-- Ô BÊN TRÁI: THÔNG TIN CHI TIẾT DỰ ÁN -->
        <div class="panel-left card-box">
          <div class="panel-header">
            <span class="project-badge-code">{{ project.ProjectCode }}</span>
            <h1 class="project-title-text">{{ project.ProjectName }}</h1>
            <p class="project-created-at">📅 Khởi tạo ngày: {{ formatDate(project.CreatedAt) }}</p>
          </div>
          
          <hr class="divider" />

          <div class="project-info-body">
            <div class="info-item full-width">
              <label>📝 Mô tả dự án</label>
              <p class="desc-text">{{ project.Description || 'Không có mô tả chi tiết cho dự án này.' }}</p>
            </div>
            
            <div class="info-meta-row">
              <div class="info-item">
                <label>🚀 Ngày bắt đầu</label>
                <p class="value-text">{{ formatDate(project.StartDate) }}</p>
              </div>
              <div class="info-item">
                <label>🏁 Ngày kết thúc</label>
                <p class="value-text">{{ formatDate(project.EndDate) }}</p>
              </div>
              <div class="info-item">
                <label>👥 Tổng nhân sự</label>
                <p class="value-text highlight">{{ projectMembers.length }} thành viên</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Ô BÊN PHẢI: THÀNH VIÊN THUỘC DỰ ÁN -->
        <div class="panel-right card-box">
          <div class="panel-header">
            <h2>👥 Thành viên dự án</h2>
            <p class="subtitle">Nhân sự được phân quyền tham gia triển khai</p>
          </div>
          
          <div class="table-container">
            <table class="custom-detail-table">
              <thead>
                <tr>
                  <th>Mã số</th>
                  <th>Họ và Tên</th>
                  <th>Vai trò đảm nhiệm</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="member in projectMembers" :key="member.UserId">
                  <td class="code-column">#{{ member.UserId }}</td>
                  <td class="name-column">{{ member.FullName }}</td>
                  <td>
                    <div class="role-badge-container">
                      <span v-for="roleId in member.Roles" :key="roleId" class="role-badge-detail">
                        {{ getRoleName(roleId) }}
                      </span>
                    </div>
                  </td>
                </tr>
                <tr v-if="projectMembers.length === 0">
                  <td colspan="3" class="empty-table-text">
                    ℹ️ Chưa có thành viên tham gia.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- ================= PHẦN DƯỚI: THÔNG TIN TASK DỰ ÁN ================= -->
      <div class="bottom-task-panel card-box">
        <div class="task-panel-header">
          <div class="title-area">
            <h2>📋 Danh sách Task (Công việc dự án)</h2>
            <p class="subtitle">Quản lý, phân công và theo dõi tiến độ các đầu việc</p>
          </div>
          <!-- Nút thêm mới task (Dành cho bạn phát triển tính năng sau này) -->
          <button class="btn-add-task" @click="openAddTaskModal">
            + Thêm Task mới
          </button>
        </div>

        <!-- Thanh tìm kiếm & Lọc trạng thái Task -->
        <div class="task-filter-bar">
          <div class="search-box">
            <span>🔍</span>
            <input v-model="taskSearchQuery" type="text" placeholder="Tìm tên task, người thực hiện..." />
          </div>
          <select v-model="taskStatusFilter" class="select-filter">
            <option value="ALL">Tất cả trạng thái</option>
            <option value="TODO">To-Do (Cần làm)</option>
            <option value="IN_PROGRESS">In Progress (Đang làm)</option>
            <option value="DONE">Done (Hoàn thành)</option>
          </select>
        </div>

        <!-- Bảng danh sách công việc -->
        <div class="table-container">
          <table class="custom-detail-table">
            <thead>
              <tr>
                <th style="width: 80px;">Mã Task</th>
                <th>Tên công việc</th>
                <th>Người thực hiện</th>
                <th>Hạn chót</th>
                <th style="width: 140px;">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              <!-- Data Task mẫu - Bạn có thể thay thế bằng v-for="task in filteredTasks" từ API của bạn -->
              <tr>
                <td class="code-column">#TASK-01</td>
                <td class="name-column">Thiết kế giao diện Database</td>
                <td>Nguyễn Văn A</td>
                <td>15/07/2026</td>
                <td><span class="task-status in-progress">Đang làm</span></td>
              </tr>
              <tr>
                <td class="code-column">#TASK-02</td>
                <td class="name-column">Viết API đăng nhập Auth bằng JWT</td>
                <td>Trần Thị B</td>
                <td>12/07/2026</td>
                <td><span class="task-status todo">Cần làm</span></td>
              </tr>
              <!-- Thông báo trống nếu không có Task -->
              <tr v-if="projectTasks.length === 0">
                <td colspan="5" class="empty-table-text">
                  ℹ️ Dự án này hiện tại chưa có task công việc nào được tạo.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <div v-else class="error-state">
      ❌ Không tìm thấy thông tin dự án hoặc bạn không có quyền truy cập vào dự án này.
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

definePageMeta({
  layout: 'default'
})

const route = useRoute()
const projectId = route.params.id

const { token } = useAuth()
const config = useRuntimeConfig()
const apiBase = config.public.apiBase || 'http://localhost:5000/api'

// States quản lý dữ liệu gốc
const project = ref(null)
const systemUsers = ref([])
const systemRoles = ref([])
const pending = ref(false)

// States bổ sung phục vụ tính năng quản lý Task (Phần dưới)
const projectTasks = ref([]) // Gán dữ liệu task từ API vào đây nếu có
const taskSearchQuery = ref('')
const taskStatusFilter = ref('ALL')

const goBack = () => {
  navigateTo('/projects')
}

// Giả lập hàm xử lý khi click nút thêm task
const openAddTaskModal = () => {
  alert('Tính năng Thêm Task mới thuộc dự án đang được xây dựng!')
}

const fetchProjectDetails = async () => {
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

    const foundProj = allProjects.find(p => String(p.Id) === String(projectId))
    if (foundProj) {
      project.value = foundProj
    }
  } catch (error) {
    console.error('Lỗi khi tải chi tiết dự án:', error)
  } finally {
    pending.value = false
  }
}

const projectMembers = computed(() => {
  if (!project.value) return []
  const membersData = project.value.ProjectMembers || project.value.members || []
  
  const grouped = {}
  membersData.forEach(m => {
    if (Number(m.IsActive) === 1) {
      if (!grouped[m.UserId]) {
        const uInfo = systemUsers.value.find(u => u.Id === m.UserId)
        grouped[m.UserId] = {
          UserId: m.UserId,
          FullName: uInfo?.FullName || `Nhân sự ID #${m.UserId}`,
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

const getRoleName = (roleId) => {
  const role = systemRoles.value.find(r => r.Id === roleId)
  return role?.RoleName || role?.Name || `Vai trò ${roleId}`
}

const formatDate = (dateStr) => {
  if (!dateStr) return 'Chưa thiết lập'
  return new Date(dateStr).toLocaleDateString('vi-VN')
}

onMounted(() => {
  fetchProjectDetails()
})
</script>

<style scoped>
.project-detail-container { padding: 12px 4px; display: flex; flex-direction: column; gap: 16px; }
.back-nav { margin-bottom: 4px; }
.btn-back { background: white; border: 1px solid #cbd5e1; padding: 8px 16px; border-radius: 6px; font-weight: 600; color: #475569; cursor: pointer; font-size: 13px; transition: all 0.2s; }
.btn-back:hover { background: #f8fafc; border-color: #94a3b8; color: #1e293b; }

/* Box dùng chung cho các khối */
.card-box { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; }
.divider { border: 0; border-top: 1px solid #f1f5f9; margin: 16px 0; }
.subtitle { font-size: 12.5px; color: #64748b; margin: 4px 0 0 0; }

/* ================= CSS PHẦN TRÊN CHIA ĐÔI (SPLIT PANEL) ================= */
.top-split-panel { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.panel-left, .panel-right { display: flex; flex-direction: column; }

/* Chi tiết thông tin dự án trái */
.project-badge-code { font-size: 11px; background: #eff6ff; color: #2563eb; padding: 3px 8px; border-radius: 6px; font-weight: 700; display: inline-block; margin-bottom: 6px; border: 1px solid #dbeafe; }
.project-title-text { font-size: 20px; font-weight: 700; color: #1e293b; margin: 0; line-height: 1.3; }
.project-created-at { font-size: 12px; color: #64748b; margin: 6px 0 0 0; }

.project-info-body { display: flex; flex-direction: column; gap: 14px; }
.info-item label { font-size: 12px; color: #64748b; font-weight: 600; display: block; margin-bottom: 4px; }
.desc-text { font-size: 13.5px; color: #334155; line-height: 1.5; margin: 0; white-space: pre-line; }
.info-meta-row { display: flex; justify-content: space-between; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #f1f5f9; gap: 10px; }
.value-text { font-size: 13.5px; color: #1e293b; font-weight: 700; margin: 0; }
.value-text.highlight { color: #2563eb; }

/* Tiêu đề bảng phải & dưới */
.panel-header h2, .task-panel-header h2 { font-size: 16px; font-weight: 700; color: #1e293b; margin: 0; }
.table-container { max-height: 230px; overflow-y: auto; margin-top: 12px; border: 1px solid #f1f5f9; border-radius: 6px; }

/* ================= CSS PHẦN DƯỚI: KHU VỰC TASK ================= */
.bottom-task-panel { display: flex; flex-direction: column; margin-top: 4px; }
.task-panel-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; }
.btn-add-task { background-color: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px; }
.btn-add-task:hover { background-color: #1d4ed8; }

/* Bộ lọc Task */
.task-filter-bar { display: flex; gap: 12px; margin-top: 14px; }
.task-filter-bar .search-box { display: flex; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 12px; flex: 1; max-width: 400px; }
.task-filter-bar .search-box input { border: none; background: transparent; outline: none; margin-left: 8px; width: 100%; font-size: 13px; }
.select-filter { border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 12px; font-size: 13px; outline: none; background-color: white; }

/* Styles table hệ thống */
.custom-detail-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
.custom-detail-table th { background: #f8fafc; padding: 10px 14px; font-weight: 600; color: #475569; border-bottom: 2px solid #e2e8f0; position: sticky; top: 0; z-index: 10; }
.custom-detail-table td { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
.code-column { font-family: monospace; color: #64748b; font-weight: bold; }
.name-column { font-weight: 600; color: #1e293b; }
.role-badge-container { display: flex; flex-wrap: wrap; gap: 4px; }
.role-badge-detail { background: #f3e8ff; color: #6b21a8; font-size: 11px; font-weight: 600; padding: 2px 6px; border-radius: 4px; border: 1px solid #e9d5ff; }
.empty-table-text { text-align: center; padding: 24px !important; color: #64748b; }

/* Badge Trạng thái Task */
.task-status { font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 600; display: inline-block; }
.task-status.todo { background: #f1f5f9; color: #475569; }
.task-status.in-progress { background: #eff6ff; color: #2563eb; }
.task-status.done { background: #ecfdf5; color: #10b981; }

/* Trạng thái Loading / Lỗi */
.loading-state, .error-state { text-align: center; padding: 50px; color: #64748b; font-size: 13.5px; background: white; border-radius: 12px; border: 1px solid #e2e8f0; }
.spinner { width: 20px; height: 20px; border: 2px solid #cbd5e1; border-top-color: #2563eb; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; margin-right: 8px; vertical-align: middle; }

@keyframes spin { to { transform: rotate(360deg); } }

/* Responsive cơ bản nếu màn hình quá nhỏ */
@media (max-width: 900px) {
  .top-split-panel { grid-template-columns: 1fr; }
}
</style>