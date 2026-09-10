import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@basketball-dynasty/shared-types': fileURLToPath(
        new URL('../packages/shared-types/src/index.ts', import.meta.url)
      ),
      '@basketball-dynasty/simulation-engine': fileURLToPath(
        new URL('../packages/simulation-engine/src/index.ts', import.meta.url)
      ),
      '@basketball-dynasty/season': fileURLToPath(
        new URL('../packages/season/src/index.ts', import.meta.url)
      ),
      '@basketball-dynasty/save-system': fileURLToPath(
        new URL('../packages/save-system/src/index.ts', import.meta.url)
      ),
      '@basketball-dynasty/data-loader': fileURLToPath(
        new URL('../packages/data-loader/src/index.ts', import.meta.url)
      ),
      '@basketball-dynasty/ai-coaching': fileURLToPath(
        new URL('../packages/ai-coaching/src/index.ts', import.meta.url)
      ),
    },
  },
});
