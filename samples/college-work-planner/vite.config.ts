import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { distriTokenProxy } from '../shared/distri-token-proxy';

export default defineConfig(({ mode }) => {
  // `''` prefix loads ALL vars, including non-VITE_ ones. Only VITE_* are
  // inlined into the client bundle — DISTRI_API_KEY stays in this Node process
  // and is exchanged for a short-lived token by the middleware below.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      distriTokenProxy({
        apiKey: env.DISTRI_API_KEY || '',
        baseUrl: env.DISTRI_BASE_URL || 'https://api.distri.dev/v1',
        workspaceId: env.DISTRI_WORKSPACE_ID || undefined,
      }),
    ],
    server: { port: 5303 },
  };
});
