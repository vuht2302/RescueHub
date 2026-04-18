import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: [
        {
          find: '@vietmap/vietmap-gl-js/dist/vietmap-gl.css',
          replacement: path.resolve(
            __dirname,
            'node_modules/@vietmap/vietmap-gl-js/dist/vietmap-gl.css'
          ),
        },
        {
          find: '@vietmap/vietmap-gl-js/dist/vietmap-gl',
          replacement: path.resolve(
            __dirname,
            'node_modules/@vietmap/vietmap-gl-js/dist/vietmap-gl.js'
          ),
        },
        {
          find: '@vietmap/vietmap-gl-js',
          replacement: path.resolve(
            __dirname,
            'node_modules/@vietmap/vietmap-gl-js/dist/vietmap-gl.js'
          ),
        },
        {
          find: '@',
          replacement: path.resolve(__dirname, '.'),
        },
      ],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
