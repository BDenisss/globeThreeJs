import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  server: { port: 5173, strictPort: true },
  optimizeDeps: { include: ['three', 'three/addons/loaders/GLTFLoader.js', 'three/addons/controls/OrbitControls.js'] },
});
