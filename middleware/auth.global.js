export default defineNuxtRouteMiddleware((to, from) => {
  const { isAuthenticated, user } = useAuth()

  // 1. Nếu đã đăng nhập mà cố tình vào lại trang /login -> Đá về trang chủ
  if (to.path === '/login' && isAuthenticated.value) {
    return navigateTo('/')
  }

  // 2. Nếu chưa đăng nhập mà cố vào bất kỳ trang nào khác /login -> Đá về trang /login
  if (to.path !== '/login' && !isAuthenticated.value) {
    return navigateTo('/login')
  }

  // 3. Phân quyền truy cập các đường dẫn (Routes) dựa trên mảng Roles của User
  if (isAuthenticated.value && user.value) {
    const userRoles = user.value.Roles || [] // Mảng Roles từ API (Ví dụ: ["Admin"] hoặc ["PM"])

    // Kiểm tra xem User có phải là Admin hoặc PM hay không
    const isAdmin = userRoles.includes('Admin')
    const isPM = userRoles.includes('PM')

    // CHẶN TRANG QUẢN LÝ NHÂN VIÊN: Chỉ cho phép Admin
    if (to.path.startsWith('/employee')) {
      if (!isAdmin) {
        return navigateTo('/') // Không phải Admin thì đá về trang chủ
      }
    }

    // CHẶN TRANG QUẢN LÝ PHÒNG BAN: Chỉ cho phép Admin
    if (to.path.startsWith('/department')) {
      if (!isAdmin) {
        return navigateTo('/') // Không phải Admin thì đá về trang chủ
      }
    }

    // CÁC TRANG CÒN LẠI (/projects, /tasks, /chat): Cả Admin, PM và Nhân viên (mọi role) đều được vào
    // Do đó không cần viết điều kiện chặn cho các trang này.
  }
})