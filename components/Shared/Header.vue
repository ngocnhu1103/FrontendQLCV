<template>
  <header class="header">
    XIN CHÀO, {{ user?.name || 'THÀNH VIÊN' }} (Quyền: {{ user?.role }})
    <button @click="logout" class="btn-logout">Đăng xuất</button>
  </header>
</template>
<script setup>
const { user, logout } = useAuth()
</script>