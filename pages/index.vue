<template>
  <div class="welcome-box">
    <h1>Chào mừng trở lại, {{ user?.FullName || 'Thành viên' }}!</h1>
    <p>Chọn các phân hệ quản lý ở thanh điều hướng bên trái để bắt đầu làm việc.</p>
  </div>
</template>

<script setup>
const { user } = useAuth()
</script>

<style scoped>
.welcome-box { padding: 32px; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
.welcome-box h1 { margin-bottom: 12px; color: #1e293b; }
.welcome-box p { color: #64748b; }
</style>