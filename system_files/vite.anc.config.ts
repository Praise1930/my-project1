import { defineConfig } from 'vite';
export default defineConfig({
  build: {
    outDir: 'dist-anc',
    emptyOutDir: true,
    lib: { entry: 'src/tests/anc_flow_test.ts', formats: ['cjs'], fileName: () => 'anc_test.cjs' },
    rollupOptions: { external: ['react', 'react-dom'] },
    minify: false
  },
  define: { 'import.meta.env.VITE_SMS_GATEWAY_URL': '""', 'import.meta.env.VITE_SUPABASE_URL': '""', 'import.meta.env.VITE_SUPABASE_ANON_KEY': '""' }
});
