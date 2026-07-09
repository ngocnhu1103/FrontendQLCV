<template>
  <div class="department-page-container">
    <div class="page-header">
      <div class="header-title">
        <h1>Quản lý phòng ban</h1>
        <p>Tổ chức cơ cấu phòng ban, bổ nhiệm trưởng phòng và quản lý nhân sự trực thuộc hệ thống Teamsync</p>
      </div>
      <button class="btn-primary" @click="openAddModal">
        <span class="icon">+</span> Thêm phòng ban
      </button>
    </div>

    <div class="filter-bar">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Tìm kiếm theo tên phòng ban..."
          @input="debounceSearch"
        />
      </div>
    </div>

    <div v-if="pending" class="loading-state">
      <div class="spinner"></div> Đang tải dữ liệu phòng ban từ hệ thống...
    </div>

    <div v-else-if="filteredDepartments.length > 0" class="table-card">
      <div class="table-responsive">
        <table class="department-table">
          <thead>
            <tr>
              <th style="width: 45%;">TÊN PHÒNG & TỔNG SỐ THÀNH VIÊN</th>
              <th style="width: 30%;">TRƯỞNG PHÒNG</th>
              <th style="width: 25%; text-align: center;">THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="dept in filteredDepartments" :key="dept.Id">
              <td>
                <div class="dept-name-wrapper">
                  <span class="dept-indicator-dot"></span>
                  <div class="dept-info-main">
                    <div class="dept-main-name">{{ dept.DepartmentName || dept.Name }}</div>
                    <span class="dept-badge">
                      👥 {{ getMemberCount(dept) }} thành viên
                    </span>
                  </div>
                </div>
              </td>

              <td>
                <div class="manager-info">
                  <span class="manager-icon">👑</span>
                  <span class="manager-name" :class="{ 'no-manager': !dept.Manager?.FullName }">
                    {{ dept.Manager?.FullName || 'Chưa bổ nhiệm' }}
                  </span>
                </div>
              </td>

              <td>
                <div class="action-buttons">
                  <button class="btn-action view" @click="openMembersModal(dept)" title="Xem danh sách nhân viên">
                    👁️ Xem thành viên
                  </button>
                  <button class="btn-action edit" @click="openEditModal(dept)" title="Chỉnh sửa">
                    📝 Sửa
                  </button>
                  <button class="btn-action delete" @click="deleteDepartment(dept.Id)" title="Xóa phòng ban">
                    🗑️ Xóa
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else class="empty-state">
      ❌ Không tìm thấy phòng ban nào phù hợp với từ khóa tìm kiếm.
    </div>

    <div v-if="isMembersModalOpen" class="modal-overlay" @click.self="closeMembersModal">
      <div class="modal-box wide-modal">
        <div class="modal-header bg-light">
          <div>
            <h2>Danh sách thành viên</h2>
            <p class="modal-subtitle">Phòng ban: <b>{{ selectedDept?.DepartmentName || selectedDept?.Name }}</b></p>
          </div>
          <button class="close-modal-btn" @click="closeMembersModal">×</button>
        </div>
        
        <div class="modal-body max-h-popup">
          <div v-if="computedSelectedUsers.length > 0" class="table-responsive">
            <table class="popup-member-table">
              <thead>
                <tr>
                  <th>MÃ NV / HỌ TÊN</th>
                  <th>LIÊN HỆ / EMAIL</th>
                  <th>VAI TRÒ</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in computedSelectedUsers" :key="user.Id">
                  <td>
                    <div class="user-main-info">
                      <div class="user-fullname">{{ user.FullName }}</div>
                      <div class="user-id-code">ID: #{{ user.Id }} | Mã: {{ user.EmployeeCode || 'N/A' }}</div>
                    </div>
                  </td>
                  <td>
                    <div class="user-contact-info">
                      <div v-if="user.Phone">📞 {{ user.Phone }}</div>
                      <div class="user-email-text">✉️ {{ user.Email }}</div>
                    </div>
                  </td>
                  <td>
                    <span class="user-role-badge">
                      {{ user.roles && user.roles.length > 0 ? user.roles[0].RoleName : (user.RoleName || 'Nhân viên') }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="popup-empty-state">
            📭 Hiện tại phòng ban này chưa có nhân viên nào được phân bổ.
          </div>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn-cancel" @click="closeMembersModal">Đóng</button>
        </div>
      </div>
    </div>

    <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal-box">
        <div class="modal-header">
          <h2>{{ isEditMode ? 'Cập nhật thông tin phòng ban' : 'Thêm mới phòng ban' }}</h2>
          <button class="close-modal-btn" @click="closeModal">×</button>
        </div>

        <form @submit.prevent="handleSubmit">
          <div class="modal-body">
            <div class="form-group">
              <label>Tên phòng ban <span class="required">*</span></label>
              <input 
                v-model="form.DepartmentName" 
                type="text" 
                placeholder="Ví dụ: Phòng Kỹ thuật, Phòng Kinh doanh..." 
                required 
              />
            </div>

            <div class="form-group">
              <label>Mô tả phòng ban</label>
              <textarea 
                v-model="form.Description" 
                placeholder="Nhập chức năng hoặc thông tin mô tả chi tiết của phòng ban..."
                rows="4"
                class="textarea-form"
              ></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-cancel" @click="closeModal">Hủy</button>
            <button type="submit" class="btn-submit" :disabled="submitting">
              {{ submitting ? 'Đang xử lý...' : (isEditMode ? 'Cập nhật' : 'Lưu lại') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

definePageMeta({
  layout: 'default'
})

const { token } = useAuth()
const config = useRuntimeConfig()
const apiBase = config.public.apiBase || 'http://localhost:5000/api'

const searchQuery = ref('')
const departmentList = ref([])
const pending = ref(false)

const isModalOpen = ref(false)
const isEditMode = ref(false)
const submitting = ref(false)
const currentDeptId = ref(null)

const defaultForm = {
  DepartmentName: '',
  Description: ''
}
const form = ref({ ...defaultForm })

const isMembersModalOpen = ref(false)
const selectedDept = ref(null)

const getRawMembers = (dept) => {
  if (!dept) return []
  return dept.employees ||          // 💡 Thêm dòng này để khớp với API của bạn
         dept.DepartmentMembers || 
         dept.departmentMembers || 
         dept.users || 
         dept.Users || 
         dept.members || []
}

// Đếm tổng số lượng thành viên đang hoạt động
const getMemberCount = (dept) => {
  const list = getRawMembers(dept)
  return Array.isArray(list) ? list.length : 0
}

// --- COMPUTED: CHUYỂN ĐỔI DỮ LIỆU THÀNH VIÊN POPUP ĐỂ HIỂN THỊ AN TOÀN ---
const computedSelectedUsers = computed(() => {
  if (!selectedDept.value) return []
  const rawList = getRawMembers(selectedDept.value)
  if (!Array.isArray(rawList)) return []
  
  return rawList.map(item => {
    // Nếu item là Object user trực tiếp hoặc lồng qua thuộc tính User/user
    const u = item.User || item.user || item
    return {
      Id: u.Id || item.UserId || item.id,
      FullName: u.FullName || item.FullName || 'Không rõ họ tên',
      EmployeeCode: u.EmployeeCode || item.EmployeeCode || '',
      Phone: u.Phone || item.Phone || '',
      Email: u.Email || item.Email || '',
      roles: u.roles || item.roles || []
    }
  })
})

const fetchDepartments = async () => {
  pending.value = true
  try {
    const res = await $fetch('/departments', {
      baseURL: apiBase,
      headers: { Authorization: `Bearer ${token.value}` }
    })
    departmentList.value = res?.data || res || []
  } catch (error) {
    console.error('Lỗi khi tải danh sách phòng ban:', error)
  } finally {
    pending.value = false
  }
}

const filteredDepartments = computed(() => {
  if (!Array.isArray(departmentList.value)) return []
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return departmentList.value

  return departmentList.value.filter(dept => {
    const name = (dept.DepartmentName || dept.Name || '').toLowerCase()
    return name.includes(query)
  })
})

const openMembersModal = (dept) => {
  console.log("Log kiểm tra dữ liệu phòng ban chọn:", dept) // In log ra F12 kiểm tra cấu trúc
  selectedDept.value = dept
  isMembersModalOpen.value = true
}

const closeMembersModal = () => {
  isMembersModalOpen.value = false
  selectedDept.value = null
}

const openAddModal = () => {
  isEditMode.value = false
  currentDeptId.value = null
  form.value = { ...defaultForm }
  isModalOpen.value = true
}

const openEditModal = (dept) => {
  isEditMode.value = true
  currentDeptId.value = dept.Id
  form.value = {
    DepartmentName: dept.DepartmentName || dept.Name || '',
    Description: dept.Description || ''
  }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    const payload = {
      DepartmentName: form.value.DepartmentName,
      Name: form.value.DepartmentName,
      Description: form.value.Description
    }

    if (isEditMode.value) {
      await $fetch(`/departments/${currentDeptId.value}`, {
        baseURL: apiBase,
        method: 'PUT',
        headers: { Authorization: `Bearer ${token.value}` },
        body: payload
      })
      alert('Cập nhật phòng ban thành công!')
    } else {
      await $fetch('/departments', {
        baseURL: apiBase,
        method: 'POST',
        headers: { Authorization: `Bearer ${token.value}` },
        body: payload
      })
      alert('Thêm mới phòng ban thành công!')
    }
    
    closeModal()
    fetchDepartments()
  } catch (error) {
    alert(error.data?.message || 'Thao tác thất bại, vui lòng thử lại!')
  } finally {
    submitting.value = false
  }
}

const deleteDepartment = async (id) => {
  if (confirm('Bạn có chắc chắn muốn xóa phòng ban này?')) {
    try {
      await $fetch(`/departments/${id}`, {
        baseURL: apiBase,
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token.value}` }
      })
      alert('Xóa phòng ban thành công!')
      fetchDepartments()
    } catch (error) {
      alert('Xóa thất bại! Phòng ban đang có nhân viên đang làm việc.')
    }
  }
}

let searchTimeout = null
const debounceSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {}, 300)
}

onMounted(() => {
  fetchDepartments()
})
</script>

<style scoped>
.department-page-container { padding: 4px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.header-title h1 { font-size: 22px; font-weight: 700; color: #1e293b; margin: 0; }
.header-title p { color: #64748b; font-size: 13px; margin: 4px 0 0 0; }

.btn-primary { background-color: #2563eb; color: white; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 6px; }
.btn-primary:hover { background-color: #1d4ed8; }

.filter-bar { display: flex; justify-content: space-between; background: white; padding: 12px 16px; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 20px; }
.search-box { display: flex; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 12px; width: 360px; }
.search-box input { border: none; background: transparent; outline: none; margin-left: 8px; width: 100%; font-size: 14px; }

.loading-state { text-align: center; padding: 40px; color: #64748b; font-size: 14px; }
.table-card { background: white; border-radius: 12px; padding: 12px; margin-bottom: 20px; border: 1px solid #e2e8f0; box-shadow: 0 1px 2px rgba(0,0,0,0.02); }

.table-responsive { overflow-x: auto; }
.department-table { width: 100%; border-collapse: collapse; text-align: left; }
.department-table th { background: #f8fafc; color: #64748b; font-size: 11px; font-weight: 600; padding: 14px 12px; border-bottom: 1px solid #e2e8f0; letter-spacing: 0.5px; }
.department-table td { padding: 16px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #334155; vertical-align: middle; }

.dept-name-wrapper { display: flex; align-items: center; gap: 10px; }
.dept-indicator-dot { width: 6px; height: 6px; background: #2563eb; border-radius: 50%; }
.dept-main-name { font-weight: 600; color: #1e293b; font-size: 15px; }
.dept-badge { font-size: 11px; background: #eff6ff; color: #2563eb; padding: 2px 8px; border-radius: 12px; font-weight: 500; margin-top: 4px; display: inline-block; }

.manager-info { display: flex; align-items: center; gap: 6px; font-size: 14px; color: #1e293b; font-weight: 600; }
.manager-icon { font-size: 14px; }
.manager-name.no-manager { color: #94a3b8; font-weight: normal; font-style: italic; }

.action-buttons { display: flex; gap: 8px; justify-content: center; }
.btn-action { background: #f8fafc; border: 1px solid #e2e8f0; cursor: pointer; font-size: 12.5px; padding: 6px 12px; border-radius: 6px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; transition: all 0.2s; }
.btn-action.view { color: #2563eb; }
.btn-action.view:hover { background: #eff6ff; border-color: #bfdbfe; }
.btn-action.edit { color: #0f766e; }
.btn-action.edit:hover { background: #f0fdfa; border-color: #99f6e4; }
.btn-action.delete { color: #e11d48; }
.btn-action.delete:hover { background: #fff1f2; border-color: #fecdd3; }

.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.4); display: flex; justify-content: center; align-items: center; z-index: 999; }
.modal-box { background: white; width: 480px; max-width: 95%; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); overflow: hidden; animation: zoomIn 0.15s ease-out; }
.modal-box.wide-modal { width: 680px; }

.modal-header { padding: 16px 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
.modal-header.bg-light { background-color: #f8fafc; }
.modal-header h2 { font-size: 16px; font-weight: 700; color: #1e293b; margin: 0; }
.modal-subtitle { font-size: 12.5px; color: #64748b; margin: 2px 0 0 0; }
.close-modal-btn { background: none; border: none; font-size: 22px; color: #94a3b8; cursor: pointer; }

.modal-body { padding: 20px; }
.max-h-popup { max-height: 55vh; overflow-y: auto; }

.popup-member-table { width: 100%; border-collapse: collapse; text-align: left; }
.popup-member-table th { background: #f1f5f9; color: #475569; font-size: 11px; font-weight: 600; padding: 10px; border-bottom: 1px solid #cbd5e1; }
.popup-member-table td { padding: 12px 10px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #334155; }
.user-fullname { font-weight: 600; color: #1e293b; }
.user-id-code { font-size: 11px; color: #94a3b8; margin-top: 1px; }
.user-contact-info { font-size: 12.5px; line-height: 1.4; }
.user-email-text { color: #64748b; }
.user-role-badge { font-size: 11px; background: #f0fdf4; color: #166534; padding: 2px 8px; border-radius: 6px; font-weight: 500; }

.form-group { margin-bottom: 16px; display: flex; flex-direction: column; }
label { font-size: 12.5px; font-weight: 600; color: #475569; margin-bottom: 6px; }
.required { color: #ef4444; }

input[type="text"], .textarea-form { padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13.5px; outline: none; background-color: white; }
.textarea-form { resize: vertical; font-family: inherit; }
input:focus, .textarea-form:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }

.modal-footer { padding: 14px 20px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 10px; }
.btn-cancel { background: white; border: 1px solid #cbd5e1; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; color: #475569; font-size: 13px; }
.btn-submit { background: #2563eb; border: none; padding: 8px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; color: white; font-size: 13px; }
.btn-submit:disabled { background: #94a3b8; cursor: not-allowed; }

.empty-state { text-align: center; padding: 40px; color: #94a3b8; font-size: 14px; background: white; border-radius: 10px; border: 1px solid #e2e8f0; }
.popup-empty-state { text-align: center; padding: 30px; color: #94a3b8; font-size: 13.5px; }
.spinner { width: 24px; height: 24px; border: 3px solid #2563eb; border-top-color: transparent; border-radius: 50%; display: inline-block; animation: spin 0.8s linear infinite; margin-right: 8px; vertical-align: middle; }

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes zoomIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
</style>