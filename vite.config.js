import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base so the build works on GitHub Pages (served from a subpath).
  base: './',
  test: {
    include: ['tests/**/*.test.js'],
    environment: 'node',
  },
});
