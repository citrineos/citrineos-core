// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: [], // optional, see below
    include: ['**/*.(test|spec).{ts,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    // If you used TS path aliases, mirror them here:
    alias: {
      // e.g. '@core': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
});
