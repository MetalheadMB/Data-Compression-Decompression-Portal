import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative asset paths: the build works at a domain root (Vercel) or under a subpath.
  base: './',
  worker: { format: 'es' },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
