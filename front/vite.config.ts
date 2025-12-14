import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true, // 모든 네트워크 인터페이스에서 접근 가능하도록 설정
    strictPort: false, // 포트가 사용 중이면 다른 포트 자동 선택
    hmr: {
      // HMR WebSocket 설정
      protocol: 'ws',
      host: 'localhost',
      port: 3000,
      clientPort: 3000
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
})





