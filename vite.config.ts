import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import relay from 'vite-plugin-relay';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), relay],
  define: {
    'process.versions.node': '"v18.16.0"',
    'process.env': {},
  },
});
