// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SRC = fileURLToPath(new URL('../src', import.meta.url));

/**
 * Modules a test is likely to name as its first import. Each has to be able to load as the entry
 * point of the graph, not only once something else has pulled its dependencies in.
 */
const ENTRY_POINTS = [
  join('mapper', 'CdrMapper.ts'),
  join('mapper', 'SessionMapper.ts'),
  join('services', 'CdrsService.ts'),
  join('services', 'CommandsService.ts'),
  join('services', 'LocationsService.ts'),
  join('services', 'SessionsService.ts'),
  join('util', 'ocppCommandHandlers', 'OCPP1_6_CommandHandler.ts'),
  join('util', 'ocppCommandHandlers', 'OCPP2_0_1_CommandHandler.ts'),
];

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

async function importFailure(file: string): Promise<string | undefined> {
  try {
    await import(pathToFileURL(file).href);
    return undefined;
  } catch (error) {
    return `${relative(SRC, file)}: ${(error as Error).message.split('\n')[0]}`;
  }
}

/**
 * Two faults in this package show up only as an exception on import, so nothing that imports the
 * offending module can be tested at all.
 *
 * typedi evaluates its decorators when a class is defined, and a parameterless `@Inject()` needs
 * the `design:type` metadata that only tsc emits, so it throws under any other transform.
 *
 * A module that reaches its own barrel closes an import cycle, and a class whose base class is
 * still initialising extends `undefined`. That one depends on where the graph is entered, which is
 * why the entry points are also loaded on their own below.
 */
describe('module loading', () => {
  it('imports the package barrel', async () => {
    await expect(import('../src/index.js')).resolves.toBeDefined();
  });

  it('imports every source module', async () => {
    const unloadable: string[] = [];

    for (const file of sourceFiles(SRC)) {
      const failure = await importFailure(file);
      if (failure) {
        unloadable.push(failure);
      }
    }

    expect(unloadable).toEqual([]);
  });

  it.each(ENTRY_POINTS)('imports %s as the entry point of a fresh graph', async (entryPoint) => {
    vi.resetModules();

    expect(await importFailure(join(SRC, entryPoint))).toBeUndefined();
  });
});
