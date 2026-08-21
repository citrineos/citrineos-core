// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SRC = fileURLToPath(new URL('../src', import.meta.url));

function sourceFiles(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      sourceFiles(path, found);
    } else if (entry.endsWith('.ts') && !entry.endsWith('.d.ts')) {
      found.push(path);
    }
  }
  return found;
}

/**
 * typedi evaluates its decorators when a class is defined, so a container wiring mistake surfaces
 * as an exception on import rather than on resolution. A parameterless `@Inject()` is the usual
 * cause: it needs the `design:type` metadata that only tsc emits, and the transform used for tests
 * does not, so one such decorator makes every module that reaches it unloadable.
 */
describe('module loading', () => {
  it('imports the package barrel', async () => {
    await expect(import('../src/index.js')).resolves.toBeDefined();
  });

  it('imports every source module', async () => {
    const unloadable: string[] = [];

    for (const file of sourceFiles(SRC)) {
      try {
        await import(pathToFileURL(file).href);
      } catch (error) {
        unloadable.push(`${relative(SRC, file)}: ${(error as Error).message.split('\n')[0]}`);
      }
    }

    expect(unloadable).toEqual([]);
  });
});
