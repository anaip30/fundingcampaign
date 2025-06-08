import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

console.log("PWD:", process.cwd()) 

export default defineConfig({
  root: resolve(__dirname), 
  plugins: [vue()]
})