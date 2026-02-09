import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // '/api'로 시작하는 요청이 오면
      '/api': {
        target: 'http://localhost:8080', // 백엔드(8080)로 몰래 전달해라
        changeOrigin: true,
        secure: false,
      },
    },
  },
})