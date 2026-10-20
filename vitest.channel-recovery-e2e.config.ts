import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['apps/ocpp-server/test/e2e/channel-recovery-e2e.test.ts'],
    environment: 'node',
    testTimeout: 180_000,
    hookTimeout: 180_000,
  },
});
