import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    ssr: 'src/tests/run_tests.ts',
    outDir: 'dist-test',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'test_bundle.cjs',
        format: 'cjs',
      }
    }
  }
});
