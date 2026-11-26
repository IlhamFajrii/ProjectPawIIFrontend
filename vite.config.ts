import { readFileSync } from 'node:fs';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

interface VercelConfig {
  headers: { source: string; headers: { key: string; value: string }[] }[];
}

// `npm run preview` memakai header yang sama dengan production, sehingga CSP bisa diuji lokal.
const vercel = JSON.parse(readFileSync(new URL('./vercel.json', import.meta.url), 'utf8')) as VercelConfig;
const productionHeaders = Object.fromEntries(
  vercel.headers.flatMap((rule) => rule.headers.map(({ key, value }) => [key, value])),
);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const proxy = {
    '/api': { target: env.VITE_PROXY_TARGET || 'http://localhost:3000', changeOrigin: true },
  };

  return {
    plugins: [react(), tailwindcss()],
    server: { port: 5173, strictPort: true, proxy },
    preview: { port: 4173, strictPort: true, proxy, headers: productionHeaders },
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      restoreMocks: true,
      unstubGlobals: true,
      unstubEnvs: true,
    },
  };
});
