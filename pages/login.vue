<template>
  <div class="login-container">
    <div class="login-box">
      <h2>ĐĂNG NHẬP HỆ THỐNG</h2>
      <form @submit.prevent="handleLogin">
        <div class="input-group">
          <label>Tài khoản</label>
          <input v-model="username" type="text" placeholder="Nhập username" required />
        </div>
        <div class="input-group">
          <label>Mật khẩu</label>
          <input v-model="password" type="password" placeholder="Nhập password" required />
        </div>
        <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
        <button type="submit" :disabled="loading">
          {{ loading ? 'Đang xử lý...' : 'Đăng nhập' }}
        </button>
      </form>
    </div>

    <div v-if="isFirstLoginModalOpen" class="modal-overlay">
      <div class="modal-box">
        <div class="modal-header">
          <h2>CẬP NHẬT MẬT KHẨU LẦN ĐẦU</h2>
        </div>
        <form @submit.prevent="handleUpdateFirstPassword">
          <div class="modal-body">
            <p class="info-alert">
              ℹ️ Đây là lần đầu tiên bạn đăng nhập. Vui lòng đổi mật khẩu mới để kích hoạt tài khoản và bảo mật thông tin.
            </p>
            <div class="form-group">
              <label>Mật khẩu mới <span class="required">*</span></label>
              <input 
                v-model="newPassword" 
                type="password" 
                placeholder="Nhập mật khẩu mới" 
                required 
                minlength="6"
              />
            </div>
            <div class="form-group">
              <label>Xác nhận mật khẩu mới <span class="required">*</span></label>
              <input 
                v-model="confirmPassword" 
                type="password" 
                placeholder="Nhập lại mật khẩu mới" 
                required 
              />
            </div>
            <p v-if="modalErrorMsg" class="error">{{ modalErrorMsg }}</p>
          </div>
          <div class="modal-footer">
            <button type="submit" class="btn-submit" :disabled="submittingPassword">
              {{ submittingPassword ? 'Đang xử lý...' : 'Kích hoạt tài khoản' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

definePageMeta({
  layout: false 
})

const config = useRuntimeConfig()
const apiBase = config.public.apiBase || 'http://localhost:5000/api'
const { login, token, user } = useAuth() 

const username = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

// State xử lý Popup đổi mật khẩu
const isFirstLoginModalOpen = ref(false)
const newPassword = ref('')
const confirmPassword = ref('')
const modalErrorMsg = ref('')
const submittingPassword = ref(false)
const tempUserId = ref(null) 

const handleLogin = async () => {
  loading.value = true
  errorMsg.value = ''
  
  const result = await login(username.value, password.value)
  loading.value = false

  if (result.success) {
    const loggedInUser = user?.value || result.user || result.data?.user
    const userStatus = Number(loggedInUser?.Status !== undefined ? loggedInUser?.Status : loggedInUser?.status)

    if (userStatus === 0) {
      errorMsg.value = 'Tài khoản đã bị khóa!'
      return
    }

    if (userStatus === -1) {
      tempUserId.value = loggedInUser?.Id || loggedInUser?.id
      isFirstLoginModalOpen.value = true
      return
    }

    navigateTo('/')
  } else {
    errorMsg.value = result.message || 'Tài khoản hoặc mật khẩu không chính xác!'
  }
}

const handleUpdateFirstPassword = async () => {
  if (newPassword.value !== confirmPassword.value) {
    modalErrorMsg.value = 'Mật khẩu xác nhận không trùng khớp!'
    return
  }

  modalErrorMsg.value = ''
  submittingPassword.value = true

  try {
    // ĐỔI ĐƯỜNG DẪN TẠI ĐÂY: Gọi chính xác endpoint chuyên biệt cho lần đầu đăng nhập
    await $fetch(`/users/${tempUserId.value}/first-password`, {
      baseURL: apiBase,
      method: 'PUT',
      headers: { 
        Authorization: `Bearer ${token.value}` 
      },
      body: {
        Password: newPassword.value // Chỉ cần truyền Password, Backend xử lý cập nhật Status = 1 tự động
      }
    })

    alert('Cập nhật mật khẩu và kích hoạt tài khoản thành công!')
    isFirstLoginModalOpen.value = false
    
    // Vào thẳng trang chủ vì token đăng nhập hiện tại vẫn hợp lệ
    navigateTo('/')
  } catch (error) {
    modalErrorMsg.value = error.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái. Vui lòng thử lại!'
  } finally {
    submittingPassword.value = false
  }
}
</script>

<style scoped>
.login-container { display: flex; justify-content: center; align-items: center; height: 100vh; background: #f3f4f6; position: relative; }
.login-box { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 100%; max-width: 400px; }
h2 { text-align: center; margin-bottom: 24px; color: #333; font-size: 18px; font-weight: 700; }
.input-group { margin-bottom: 16px; }
.input-group label { display: block; margin-bottom: 6px; font-weight: bold; font-size: 14px; }
.input-group input { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;}
.error { color: #ef4444; font-size: 13.5px; margin-bottom: 10px; font-weight: 500; }
button { width: 100%; padding: 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;}
button:disabled { background: #aaa; cursor: not-allowed; }

.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.5); display: flex; justify-content: center; align-items: center; z-index: 999; }
.modal-box { background: white; width: 440px; max-width: 90%; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); overflow: hidden; }
.modal-header { padding: 16px 20px; border-bottom: 1px solid #e2e8f0; text-align: center; background: #f8fafc; }
.modal-body { padding: 20px; }
.info-alert { padding: 10px 12px; background-color: #f0fdf4; border: 1px dashed #4ade80; border-radius: 6px; font-size: 12.5px; color: #166534; line-height: 1.4; margin-bottom: 16px; text-align: left; }
.form-group { margin-bottom: 14px; display: flex; flex-direction: column; text-align: left; }
.form-group label { font-size: 12.5px; font-weight: 600; color: #475569; margin-bottom: 6px; }
.required { color: #ef4444; }
.form-group input[type="password"] { padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13.5px; outline: none; }
.form-group input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
.modal-footer { padding: 14px 20px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: center; }
.btn-submit { background: #2563eb; border: none; padding: 10px 24px; border-radius: 6px; font-weight: 600; cursor: pointer; color: white; font-size: 13.5px; width: 100%; }
.btn-submit:disabled { background: #94a3b8; cursor: not-allowed; }
</style>