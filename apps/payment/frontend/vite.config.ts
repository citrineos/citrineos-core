// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// In development the payment server runs on its own port; in production it serves these pages.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // `pnpm dev` shares the terminal with the server; clearing it would hide the server's log.
  clearScreen: false,
  server: {
    port: 3010,
    proxy: { '/api': 'http://localhost:9010' },
  },
});
