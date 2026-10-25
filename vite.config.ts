import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Served from https://<user>.github.io/bebislogg/. Changing this path moves the
// app to a new storage origin/scope, so existing data must be moved via export/import.
const BASE = '/bebislogg/';

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Bebislogg',
        short_name: 'Bebislogg',
        lang: 'sv',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#161826',
        theme_color: '#161826',
        // Icons are added in stage 7 (app icon 1a).
        icons: [],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
      },
    }),
  ],
  test: {
    environment: 'node',
    // Date logic is tested against Swedish DST, also in CI (which runs in UTC).
    env: { TZ: 'Europe/Stockholm' },
  },
});
