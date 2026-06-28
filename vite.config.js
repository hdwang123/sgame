import { defineConfig } from 'vite';

export default defineConfig({
  // Keep production URLs relative so the game works at a domain root,
  // GitHub Pages repository path, or any other deployment subdirectory.
  base: './',
});
