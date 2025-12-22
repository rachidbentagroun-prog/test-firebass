
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'node:process';

export default defineConfig(({ mode }) => {
  // Load local env variables for development
  const env = loadEnv(mode, process.cwd(), '');
  
  // Prioritize the system environment variable (provided by Vercel) 
  // over the local .env file during build.
  // We use a fallback empty string to prevent build errors.
  const apiKey = process.env.API_KEY || env.API_KEY || '';

  return {
    base: '/',
    plugins: [react()],
    define: {
      // Vite replaces 'process.env.API_KEY' with the actual string in the final bundle
      'process.env.API_KEY': JSON.stringify(apiKey)
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      target: 'esnext'
    },
    server: {
      port: 3000
    }
  };
});
