export const useAuth = () => {
  const token = useCookie('auth_token', { maxAge: 60 * 60 * 24 })
  const user = useState('auth_user', () => null)
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase || 'http://localhost:5000/api'

  const isAuthenticated = computed(() => !!token.value)

  const login = async (username, password) => {
    try {
      const response = await $fetch('/auth/login', {
        baseURL: apiBase,
        method: 'POST',
        body: { username, password }
      })

      // Đọc đúng theo cấu trúc JSON của bạn: response.success và response.data
      if (response && response.success && response.data) {
        token.value = response.data.token
        
        // Lưu toàn bộ thông tin user (bao gồm mảng Roles) vào state
        user.value = response.data.user 
        
        return { success: true }
      }
      
      return { success: false, message: response?.message || 'Dữ liệu phản hồi không hợp lệ' }
    } catch (error) {
      console.error('Login Error:', error)
      return { 
        success: false, 
        message: error.data?.message || 'Tài khoản hoặc mật khẩu không đúng' 
      }
    }
  }

  const logout = () => {
    token.value = null
    user.value = null
    navigateTo('/login')
  }

  return {
    token,
    user,
    isAuthenticated,
    login,
    logout
  }
}