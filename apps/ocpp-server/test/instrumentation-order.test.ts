// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// A late import still compiles and runs; every core instrument is then silently a no-op.
describe('ocpp-server entrypoint', () => {
  it('imports the metrics instrumentation before anything else', () => {
    const source = readFileSync(fileURLToPath(new URL('../src/index.ts', import.meta.url)), 'utf8');
    const firstImport = source.match(/^import\s.*$/m)?.[0];
    expect(firstImport).toBe("import './instrumentation.js';");
  });
});
