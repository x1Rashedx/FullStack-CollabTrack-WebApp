import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  console.log('Serving URL:', env.VITE_URL);
  console.log('API URL:', env.VITE_API_URL);

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: [
        'localhost',
        '127.0.0.1',
        env.VITE_URL.replace(/^https?:\/\//, ''),
      ],
    },
    plugins: [
      react(),
      tsconfigPaths()
    ],
  };
});
