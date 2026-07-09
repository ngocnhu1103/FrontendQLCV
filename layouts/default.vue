<template>
  <div class="dashboard-container">
    <aside class="sidebar">

      <div class="user-profile" v-if="user">
        <div class="avatar">{{ user.FullName ? user.FullName.charAt(0) : 'U' }}</div>
        <div class="user-info">
          <p class="user-name">{{ user.FullName || user.Username }}</p>
        </div>
      </div>

      <nav class="sidebar-menu">
        <button 
          v-for="item in filteredMenu" 
          :key="item.name" 
          class="menu-nav-item"
          :class="{ active: route.path === item.path }"
          @click="navigateTo(item.path)"
        >
          <span class="menu-icon">📁</span>
          <span class="menu-text">{{ item.name }}</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <button @click="logout" class="btn-logout">
          <span class="menu-icon">🚪</span> Đăng xuất
        </button>
      </div>
    </aside>

    <main class="main-content">
      <header class="main-header">
        <div class="breadcrumb">Hệ thống / {{ currentRouteName }}</div>
      </header>
      <div class="page-body">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup>
const { user, logout } = useAuth()
const route = useRoute()

const userRole = computed(() => {
  const roles = user.value?.Roles
  if (roles && roles.length > 0) {
    const mainRole = roles[0]
    if (mainRole === 'Admin' || mainRole === 'PM') return mainRole
  }
  return 'NhanVien'
})

const allMenuItems = [
  { name: 'Quản lý nhân viên', path: '/employee', roles: ['Admin'] },
  { name: 'Quản lý phòng ban', path: '/department', roles: ['Admin'] },
  { name: 'Quản lý dự án', path: '/projects', roles: ['Admin', 'PM', 'NhanVien'] },
  { name: 'Quản lý task', path: '/tasks', roles: ['Admin', 'PM', 'NhanVien'] },
  { name: 'Chatbox', path: '/chat', roles: ['Admin', 'PM', 'NhanVien'] }
]

const filteredMenu = computed(() => {
  if (!user.value) return []
  return allMenuItems.filter(item => item.roles.includes(userRole.value))
})

const currentRouteName = computed(() => {
  const match = allMenuItems.find(item => item.path === route.path)
  return match ? match.name : 'Bảng điều khiển'
})
</script>

<style scoped>
/* Giữ nguyên toàn bộ đoạn CSS của .dashboard-container, .sidebar, .main-content... từ file index.vue cũ của bạn qua đây */
.dashboard-container { display: flex; height: 100vh; width: 100vw; font-family: sans-serif; background-color: #f4f6f9; overflow: hidden; }
.sidebar { width: 260px; background-color: #1e293b; color: #f8fafc; display: flex; flex-direction: column; }
.sidebar-logo { padding: 24px; text-align: center; border-bottom: 1px solid #334155; }
.sidebar-logo h2 { font-size: 20px; color: #38bdf8; margin: 0; }
.user-profile { display: flex; align-items: center; padding: 20px; border-bottom: 1px solid #334155; background-color: #111827; }
.avatar { width: 42px; height: 42px; background-color: #38bdf8; color: #1e293b; font-weight: bold; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; }
.user-info { display: flex; flex-direction: column; }
.user-name { font-size: 14px; font-weight: 600; margin: 0; }
.user-role-badge { font-size: 11px; background-color: #0284c7; padding: 2px 8px; border-radius: 12px; width: fit-content; }
.sidebar-menu { flex: 1; padding: 16px 0; }
.menu-nav-item { width: 100%; display: flex; align-items: center; padding: 14px 24px; background: none; border: none; color: #94a3b8; font-size: 15px; text-align: left; cursor: pointer; }
.menu-nav-item:hover, .menu-nav-item.active { background-color: #334155; color: #f8fafc; }
.menu-icon { margin-right: 12px; }
.sidebar-footer { padding: 16px; border-top: 1px solid #334155; }
.btn-logout { width: 100%; display: flex; align-items: center; justify-content: center; padding: 11px; background-color: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; }
.main-content { flex: 1; display: flex; flex-direction: column; overflow-y: auto; }
.main-header { background-color: white; padding: 16px 32px; display: flex; justify-content: space-between;  box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.page-body { padding: 32px; flex: 1; }
</style>