import { defineConfig } from 'vitest/config';

// The game's own tests only: the engine submodule has its own.
export default defineConfig({
  test: { include: ['tests/**/*.test.ts'] },
});
