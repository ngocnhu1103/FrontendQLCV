<template>
  <div class="employee-container">
    <div class="page-header">
      <div class="header-title">
        <h1>Danh sách nhân viên</h1>
      </div>
      <button class="btn-primary" @click="openAddModal">
        <span class="icon">+</span> Thêm nhân viên
      </button>
    </div>

    <div class="filter-bar">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Tìm kiếm theo tên nhân viên..."
        />
      </div>
      <div class="filter-actions">
        <select v-model="statusFilter" @change="fetchEmployees" class="select-filter">
          <option value="1">Đang hoạt động</option>
          <option value="0">Ngưng hoạt động / Đã khóa</option>
        </select>
      </div>
    </div>

    <div v-if="pending" class="loading-state">
      <div class="spinner"></div> Đang tải dữ liệu nhân viên từ hệ thống...
    </div>

    <div v-else-if="groupedEmployees.length > 0" class="department-list">
      <div v-for="dept in groupedEmployees" :key="dept.name" class="department-group">
        <div class="department-header">
          <span class="dept-indicator"></span>
          <h3>{{ dept.name }}</h3>
          <span class="dept-badge">{{ dept.employees.length }} Nhân viên</span>
        </div>

        <div class="table-responsive">
          <table class="employee-table">
            <thead>
              <tr>
                <th>NHÂN VIÊN & VAI TRÒ</th>
                <th>THÔNG TIN LIÊN HỆ</th>
                <th>NGÀY SINH</th>
                <th>ĐỊA CHỈ</th>
                <th>TRẠNG THÁI</th>
                <th>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="emp in dept.employees" :key="emp.Id">
                <td>
                  <div class="emp-profile">
                    <div class="emp-name">{{ emp.FullName }}</div>
                    <div :class="['emp-role', emp.RoleId ? 'has-role' : 'no-role']">
                      {{ emp.RoleName }}
                    </div>
                    <div class="emp-code-id">ID: #{{ emp.Id }} | Mã: {{ emp.EmployeeCode || 'N/A' }}</div>
                  </div>
                </td>
                <td>
                  <div class="emp-contact">
                    <div v-if="emp.Phone">📞 {{ emp.Phone }}</div>
                    <div class="emp-email">✉️ {{ emp.Email }}</div>
                  </div>
                </td>
                <td>{{ emp.DateOfBirth ? formatDate(emp.DateOfBirth) : 'Chưa cập nhật' }}</td>
                <td><span class="text-truncate" :title="emp.Address">{{ emp.Address || 'Chưa cập nhật' }}</span></td>
                <td>
                    <!-- Hiển thị trạng thái user -->
                    <span :class="['status-badge', Number(emp.Status) === 1? 'active': Number(emp.Status) === -1? 'pending': 'inactive'  ]">
                    ●  {{ Number(emp.Status) === 1 ? 'Hoạt động': Number(emp.Status) === -1? 'Chưa kích hoạt': 'Khóa tài khoản' }}
                    </span>
                </td>
                <td>
                  <div class="action-buttons">
                    <button class="btn-action edit" @click="openEditModal(emp)" title="Chỉnh sửa">
                      📝
                    </button>
                    <button class="btn-action delete" @click="deleteEmployee(emp.Id)" title="Ngừng hoạt động">
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      ❌ Không tìm thấy nhân viên nào phù hợp với bộ lọc hiện tại.
    </div>

    <!-- Modal Thêm/Sửa Nhân viên -->
    <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal-box">
        <div class="modal-header">
          <h2>{{ isEditMode ? 'Cập nhật thông tin nhân viên' : 'Thêm mới nhân viên' }}</h2>
          <button class="close-modal-btn" @click="closeModal">×</button>
        </div>

        <form @submit.prevent="handleSubmit">
          <div class="modal-body">
            <div class="form-group">
              <label>Họ và tên <span class="required">*</span></label>
              <input v-model="form.FullName" type="text" placeholder="Nhập họ và tên" required />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Phòng ban trực thuộc <span class="required">*</span></label>
                <select v-model="form.PhongBanID" class="select-form" required>
                  <option value="">-- Chọn phòng ban --</option>
                  <option v-for="dept in departments" :key="dept.Id" :value="dept.Id">
                    {{ dept.DepartmentName || dept.Name }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label>Quyền hệ thống (Role) <span class="required">*</span></label>
                <select v-model="form.RoleId" class="select-form" required>
                  <option value="">-- Chọn vai trò --</option>
                  <option v-for="role in roles" :key="role.Id" :value="role.Id">
                    {{ role.RoleName || role.Name }}
                  </option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Số điện thoại</label>
                <input v-model="form.Phone" type="text" placeholder="Nhập số điện thoại" />
              </div>
              <div class="form-group">
                <label>Ngày sinh</label>
                <input v-model="form.DateOfBirth" type="date" />
              </div>
            </div>

            <div class="form-group">
              <label>Giới tính</label>
              <div class="radio-group">
                <label><input type="radio" v-model="form.Gender" :value="1" /> Nam</label>
                <label><input type="radio" v-model="form.Gender" :value="0" /> Nữ</label>
              </div>
            </div>

            <div class="form-group">
              <label>Địa chỉ thường trú</label>
              <input v-model="form.Address" type="text" placeholder="Số nhà, tên đường, tỉnh thành..." />
            </div>

            <div class="form-group" v-if="isEditMode">
              <label>Mật khẩu mới <span class="hint">(Để trống nếu giữ nguyên không đổi)</span></label>
              <input v-model="form.Password" type="password" placeholder="Nhập mật khẩu mới" />
            </div>
            <div class="form-group info-alert" v-else>
              ℹ️ Hệ thống sẽ tự động tạo Email tài khoản và Mật khẩu mặc định là <b>123456</b>.
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

// Các state quản lý danh sách
const searchQuery = ref('')
const statusFilter = ref('1')
const employeeList = ref([])
const pending = ref(false)

// Danh mục tổng thể phục vụ Form
const departments = ref([])
const roles = ref([])

// Trạng thái điều khiển Modal
const isModalOpen = ref(false)
const isEditMode = ref(false)
const submitting = ref(false)
const currentUserId = ref(null)

const defaultForm = {
  FullName: '',
  PhongBanID: '',
  RoleId: '',
  Phone: '',
  DateOfBirth: '',
  Gender: 1,
  Address: '',
  Password: ''
}
const form = ref({ ...defaultForm })

// 1. Tải danh sách toàn bộ nhân viên từ API dựa theo statusFilter
const fetchEmployees = async () => {
  pending.value = true
  try {
    const apiQuery = {}
    
    // Nếu chọn trạng thái 'Ngưng hoạt động' (0), ta truyền status=0 để API tối ưu lọc luôn
    if (statusFilter.value === '0') {
      apiQuery.status = '0'
    }
    // LƯU Ý QUAN TRỌNG: Khi chọn 'Đang hoạt động' (1), ta KHÔNG gửi trường status lên API nữa
    // nhằm mục đích để API trả về đầy đủ tất cả các bản ghi (bao gồm cả status = -1)

    const response = await $fetch('/users', {
      baseURL: apiBase,
      headers: { Authorization: `Bearer ${token.value}` },
      query: apiQuery
    })
    
    const users = response.data || response || []
    
    // Đọc mảng 'roles' bóc tách gán giá trị hiển thị vai trò
    const mappedUsers = users.map(user => {
      let matchedRoleName = 'Chưa phân vai trò'
      let matchedRoleId = ''

      if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
        matchedRoleName = user.roles[0].RoleName || user.roles[0].Name || 'Chưa phân vai trò'
        matchedRoleId = user.roles[0].Id || user.roles[0].RoleId || ''
      }

      return {
        ...user,
        RoleName: matchedRoleName,
        RoleId: matchedRoleId
      }
    })

    // Thực hiện lọc chính xác danh sách nhân sự tại Client-side
    if (statusFilter.value === '1') {
      // "Đang hoạt động" bao gồm cả trạng thái kích hoạt (1) và tài khoản mới khởi tạo (-1)
      employeeList.value = mappedUsers.filter(user => [1, -1].includes(Number(user.Status)))
    } else {
      // "Ngưng hoạt động"
      employeeList.value = mappedUsers.filter(user => Number(user.Status) === 0)
    }

  } catch (error) {
    console.error('Lỗi khi fetch dữ liệu nhân viên:', error)
  } finally {
    pending.value = false
  }
}

// 2. Tải danh mục Phòng ban và Roles hệ thống phục vụ biểu mẫu thêm/sửa
const fetchCategories = async () => {
  try {
    const [deptsRes, rolesRes] = await Promise.all([
      $fetch('/departments', { 
        baseURL: apiBase, 
        headers: { Authorization: `Bearer ${token.value}` } 
      }),
      $fetch('/roles', { 
        baseURL: apiBase, 
        headers: { Authorization: `Bearer ${token.value}` } 
      })
    ])

    departments.value = deptsRes?.data || deptsRes || []
    roles.value = rolesRes?.data || rolesRes || []
  } catch (error) {
    console.error('Lỗi khi tải danh mục ban đầu:', error)
  }
}

// 3. Thực hiện lọc danh sách theo chuỗi tìm kiếm 'searchQuery' nhập từ Client
const filteredEmployeesBySearch = computed(() => {
  if (!Array.isArray(employeeList.value)) return []
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return employeeList.value

  return employeeList.value.filter(emp => {
    const name = (emp.FullName || '').toLowerCase()
    return name.includes(query)
  })
})

// 4. Gom nhóm nhân viên theo phòng ban dựa trên danh sách đã lọc tìm kiếm phía trên
const groupedEmployees = computed(() => {
  const groups = {}
  
  filteredEmployeesBySearch.value.forEach(emp => {
    const deptName = emp.DepartmentName || emp.PhongBan?.DepartmentName || 'Tất cả nhân viên'
    if (!groups[deptName]) groups[deptName] = []
    groups[deptName].push(emp)
  })
  
  return Object.keys(groups).map(key => ({
    name: key,
    employees: groups[key]
  }))
})

// Mở form thêm mới nhân viên
const openAddModal = () => {
  isEditMode.value = false
  currentUserId.value = null
  form.value = { ...defaultForm }
  isModalOpen.value = true
}

// Mở form chỉnh sửa thông tin nhân viên
const openEditModal = (emp) => {
  isEditMode.value = true
  currentUserId.value = emp.Id
  
  let formattedDate = ''
  if (emp.DateOfBirth) {
    formattedDate = new Date(emp.DateOfBirth).toISOString().split('T')[0]
  }

  form.value = {
    FullName: emp.FullName || '',
    PhongBanID: emp.PhongBanID || '',
    RoleId: emp.RoleId || '',
    Phone: emp.Phone || '',
    DateOfBirth: formattedDate,
    Gender: emp.Gender !== undefined ? Number(emp.Gender) : 1,
    Address: emp.Address || '',
    Password: ''
  }
  
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

// Gửi dữ liệu xử lý Thêm / Sửa về API
const handleSubmit = async () => {
  submitting.value = true
  try {
    const payload = {
      FullName: form.value.FullName,
      PhongBanID: form.value.PhongBanID ? Number(form.value.PhongBanID) : null,
      RoleId: form.value.RoleId ? Number(form.value.RoleId) : null,
      Phone: form.value.Phone,
      DateOfBirth: form.value.DateOfBirth || null,
      Gender: Number(form.value.Gender),
      Address: form.value.Address
    }

    if (isEditMode.value) {
      if (form.value.Password) payload.Password = form.value.Password
      
      await $fetch(`/users/${currentUserId.value}`, {
        baseURL: apiBase,
        method: 'PUT',
        headers: { Authorization: `Bearer ${token.value}` },
        body: payload
      })
      alert('Cập nhật thông tin và vai trò nhân viên thành công!')
    } else {
      await $fetch('/users', {
        baseURL: apiBase,
        method: 'POST',
        headers: { Authorization: `Bearer ${token.value}` },
        body: payload
      })
      alert('Thêm mới nhân viên thành công!')
    }
    
    closeModal()
    fetchEmployees()
  } catch (error) {
    alert(error.data?.message || 'Thao tác thất bại, vui lòng thử lại!')
  } finally {
    submitting.value = false
  }
}

// Ngưng hoạt động nhân viên
const deleteEmployee = async (id) => {
  if (confirm('Bạn có chắc chắn muốn ngưng hoạt động nhân viên này?')) {
    try {
      await $fetch(`/users/${id}`, {
        baseURL: apiBase,
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token.value}` }
      })
      alert('Thay đổi trạng thái nhân viên thành công!')
      fetchEmployees()
    } catch (error) {
      alert('Thao tác xóa thất bại!')
    }
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('vi-VN')
}

onMounted(() => {
  fetchEmployees()
  fetchCategories()
})
</script>

<style scoped>
.employee-container { padding: 4px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.header-title h1 { font-size: 22px; font-weight: 700; color: #1e293b; margin: 0; }

.btn-primary { background-color: #2563eb; color: white; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 6px; }
.btn-primary:hover { background-color: #1d4ed8; }

.filter-bar { display: flex; justify-content: space-between; background: white; padding: 12px 16px; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 20px; }
.search-box { display: flex; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 12px; width: 360px; }
.search-box input { border: none; background: transparent; outline: none; margin-left: 8px; width: 100%; font-size: 14px; }
.select-filter, .select-form { border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; font-size: 14px; background-color: white; outline: none; min-width: 150px; }

.loading-state { text-align: center; padding: 40px; color: #64748b; font-size: 14px; }
.department-group { background: white; border-radius: 12px; padding: 18px; margin-bottom: 20px; border: 1px solid #e2e8f0; box-shadow: 0 1px 2px rgba(0,0,0,0.02); }
.department-header { display: flex; align-items: center; margin-bottom: 14px; }
.dept-indicator { width: 4px; height: 16px; background: #2563eb; border-radius: 4px; margin-right: 8px; }
.department-header h3 { margin: 0 10px 0 0; font-size: 15px; font-weight: 700; color: #1e293b; }
.dept-badge { font-size: 11px; background: #eff6ff; color: #2563eb; padding: 2px 8px; border-radius: 12px; font-weight: 500; }

.table-responsive { overflow-x: auto; }
.employee-table { width: 100%; border-collapse: collapse; text-align: left; }
.employee-table th { background: #f8fafc; color: #64748b; font-size: 11px; font-weight: 600; padding: 10px 12px; border-bottom: 1px solid #e2e8f0; letter-spacing: 0.5px; }
.employee-table td { padding: 14px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13.5px; color: #334155; vertical-align: middle; }

.emp-name { font-weight: 600; color: #1e293b; font-size: 14.5px; }
.emp-role { font-size: 12px; font-weight: 500; margin-top: 2px; }
.emp-role.has-role { color: #2563eb; }
.emp-role.no-role { color: #94a3b8; font-style: italic; }
.emp-code-id { font-size: 11px; color: #94a3b8; margin-top: 2px; }
.emp-contact { font-size: 13px; line-height: 1.4; }
.emp-email { color: #64748b; }

.status-badge { font-size: 11px; padding: 4px 8px; border-radius: 20px; font-weight: 500; display: inline-flex; align-items: center; gap: 4px; }
.status-badge.active { background: #ecfdf5; color: #10b981; }
.status-badge.inactive { background: #fef2f2; color: #ef4444; }

.action-buttons { display: flex; gap: 10px; }
.btn-action { background: none; border: none; cursor: pointer; font-size: 15px; padding: 4px; border-radius: 4px; }
.btn-action:hover { background: #f1f5f9; }

.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.4); display: flex; justify-content: center; align-items: center; z-index: 999; }
.modal-box { background: white; width: 540px; max-width: 95%; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); overflow: hidden; animation: zoomIn 0.15s ease-out; }
.modal-header { padding: 16px 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
.modal-header h2 { font-size: 16px; font-weight: 700; color: #1e293b; margin: 0; }
.close-modal-btn { background: none; border: none; font-size: 22px; color: #94a3b8; cursor: pointer; }

.modal-body { padding: 20px; max-height: 70vh; overflow-y: auto; }
.form-group { margin-bottom: 14px; display: flex; flex-direction: column; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
label { font-size: 12.5px; font-weight: 600; color: #475569; margin-bottom: 4px; }
.required { color: #ef4444; }
.hint { font-size: 11px; color: #94a3b8; font-weight: normal; }
.info-alert { padding: 10px 12px; background-color: #f0fdf4; border: 1px dashed #4ade80; border-radius: 6px; font-size: 12.5px; color: #166534; display: block; line-height: 1.4; }

input[type="text"], input[type="password"], input[type="date"], .select-form { padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13.5px; outline: none; background-color: white; }
input:focus, .select-form:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
.radio-group { display: flex; gap: 20px; padding: 4px 0; }
.radio-group label { display: flex; align-items: center; gap: 6px; cursor: pointer; font-weight: normal; font-size: 13.5px; }

.modal-footer { padding: 14px 20px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 10px; }
.btn-cancel { background: white; border: 1px solid #cbd5e1; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; color: #475569; font-size: 13px; }
.btn-submit { background: #2563eb; border: none; padding: 8px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; color: white; font-size: 13px; }
.btn-submit:disabled { background: #94a3b8; cursor: not-allowed; }

.text-truncate { display: block; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.empty-state { text-align: center; padding: 40px; color: #94a3b8; font-size: 14px; background: white; border-radius: 10px; border: 1px solid #e2e8f0; }

@keyframes zoomIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
</style>