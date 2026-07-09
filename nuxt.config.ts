export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      // Bỏ hẳn process.env đi, Nuxt sẽ tự hiểu và đè proxy nếu có file .env
      apiBase: 'http://localhost:5000/api' 
    }
  }
})