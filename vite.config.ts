import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Frontend-only build. The API lives in /api as Vercel Serverless Functions.
// Use `vercel dev` to run the frontend + /api together locally.
export default defineConfig({
  plugins: [react()],
});
