// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { OCPP_VERSION_LIST } from '@citrineos/types';
import { describe, expect, it } from 'vitest';
import { ocpiConfigSchema } from '../../src/config/ocpi.types.js';

// The handler classes cannot be imported here: they are typedi @Service classes
// and vitest's transform does not emit decorator metadata, so importing one
// throws CannotInjectValueError. Their source is read instead.
const HANDLER_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../src/util/ocppCommandHandlers',
);

function handlerSources(): string[] {
  return readdirSync(HANDLER_DIR)
    .filter((f) => f.endsWith('_CommandHandler.ts'))
    .map((f) => readFileSync(join(HANDLER_DIR, f), 'utf-8'));
}

/**
 * CommandExecutor keys its handler registry by ChargingStations.protocol, which
 * is whatever subprotocol the station's websocket negotiated. Core offers all
 * of OCPP_VERSION_LIST and prefers the newest, so a charger that speaks 2.1 is
 * recorded as ocpp2.1 — and with no handler for that version every OCPI command
 * was answered with a CommandResult of FAILED ("Charging station communication
 * failed") without a message ever reaching the station.
 */
describe('OCPP command handlers', () => {
  it('one exists for every OCPP version core can negotiate', () => {
    const sources = handlerSources();

    for (const version of OCPP_VERSION_LIST) {
      const member = `OCPPVersion.${version.replace('ocpp', 'OCPP').replace(/\./g, '_')}`;
      const handler = sources.filter((src) => src.includes(`= ${member};`));
      expect(handler, `no command handler declares ${member}`).toHaveLength(1);
    }
  });

  /**
   * OcppSender refuses a call whose requested protocol is not the one the
   * connection negotiated, so a 2.1 station has to be commanded through core's
   * 2.1 routes — pointing the 2.1 handler at the 2.0.1 URLs would fail just as
   * surely, only with a different message.
   */
  it('the 2.1 handler reads its own urls, not the 2.0.1 ones', () => {
    const src = readFileSync(join(HANDLER_DIR, 'OCPP2_1_CommandHandler.ts'), 'utf-8');

    expect(src).toContain('this.config.commands.ocpp2_1');
    expect(src).not.toContain('commands.ocpp2_0_1');
  });

  it('the config carries a url per command for every 2.x version', () => {
    const commands = ocpiConfigSchema.shape.commands;
    const perVersion = ['ocpp2_0_1', 'ocpp2_1'] as const;

    for (const version of perVersion) {
      expect(Object.keys(commands.shape[version].shape).sort()).toEqual([
        'requestStartTransactionRequestUrl',
        'requestStopTransactionRequestUrl',
        'unlockConnectorRequestUrl',
      ]);
    }
  });
});
