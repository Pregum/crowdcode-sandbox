import { defineConfig } from 'mastra';

export default defineConfig({
  dev: {
    server: {
      entrypoint: './src/server.ts',
      env: '.env',
    },
    vite: {
      configFile: './vite.config.ts',
    },
  },
});