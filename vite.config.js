import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base so the build works on GitHub Pages (served from a subpath).
  base: './',
  build: {
    // The 3D chunk (Three.js) is about 540 kB before gzip. It is loaded on demand with import(),
    // after the game is already playable, so it does not slow down the first screen.
    chunkSizeWarningLimit: 600,
  },
  test: {
    include: ['tests/**/*.test.js'],
    environment: 'node',
  },
});
