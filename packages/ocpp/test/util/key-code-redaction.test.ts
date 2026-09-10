// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { loggerDefaults, redactionMiddleware } from '@citrineos/base';
import { logRedactionSchema, OCPP2_0_1, OCPP2_1 } from '@citrineos/types';
import { keyCodeRedactionRule } from '@util/index.js';
import { type ILogObj, type ILogObjMeta, Logger } from 'tslog';
import { describe, expect, it } from 'vitest';

/**
 * C04.FR.04: "If an idToken of type keyCode is used - The Charging Station or CSMS SHALL NOT show
 * the IdToken in any logging."
 *
 * A key code is the PIN a driver typed at the Charging Station.
 */
const KEY_CODE = 'PIN#1234';
const PLACEHOLDER = '[***]';
const TAG_ID = '046A1B2C3D';

const rule = keyCodeRedactionRule(PLACEHOLDER);

/** A logger wired the way the server wires its root logger. */
function aLogger() {
  const config = logRedactionSchema.parse({ placeholder: PLACEHOLDER });
  const written: (ILogObj & ILogObjMeta)[] = [];
  const logger = new Logger<ILogObj>({
    ...loggerDefaults('production', config),
    middleware: [redactionMiddleware([keyCodeRedactionRule(config.placeholder)])],
    name: 'CitrineOS Logger',
    minLevel: 0,
    type: 'hidden',
  });
  logger.attachTransport((record) => {
    written.push(record);
  });
  return { logger, written };
}

const everythingWritten = (written: (ILogObj & ILogObjMeta)[]) => JSON.stringify(written);

/** An AuthorizeRequest as it arrives, which is what the handler logs wholesale. */
const anAuthorizeRequest = (idToken: { idToken: string; type: string }) => ({
  context: { tenantId: 1, stationId: 'cp-1', correlationId: 'corr-1' },
  payload: { idToken },
  action: 'Authorize',
});

describe('keyCodeRedactionRule', () => {
  it.each([
    ['2.0.1', OCPP2_0_1.IdTokenEnumType.KeyCode],
    ['2.1', OCPP2_1.IdTokenEnumType.KeyCode],
  ])('redacts a KeyCode idToken for OCPP %s', (_version, type) => {
    expect(rule({ idToken: KEY_CODE, type })).toEqual({ idToken: PLACEHOLDER });
  });

  it.each(
    Object.values(OCPP2_1.IdTokenEnumType).filter((t) => t !== OCPP2_1.IdTokenEnumType.KeyCode),
  )('leaves a %s idToken readable, because it identifies rather than authenticates', (type) => {
    expect(rule({ idToken: TAG_ID, type })).toBeUndefined();
  });

  it('ignores an object that has a KeyCode type but no idToken to redact', () => {
    expect(rule({ type: OCPP2_1.IdTokenEnumType.KeyCode })).toBeUndefined();
  });

  it('ignores an idToken whose type is absent', () => {
    expect(rule({ idToken: KEY_CODE })).toBeUndefined();
  });
});

describe('a key code never reaches the log', () => {
  it('is redacted when the whole received message is logged', () => {
    // This is the call the handler makes on every AuthorizeRequest: the entire message, including
    // the idToken, handed to the logger.
    const { logger, written } = aLogger();

    logger.info(
      'AuthorizeRequest received',
      anAuthorizeRequest({ idToken: KEY_CODE, type: OCPP2_1.IdTokenEnumType.KeyCode }),
    );

    expect(everythingWritten(written)).not.toContain(KEY_CODE);
    // The rest of the message still has to be there, or the log is useless for debugging.
    expect(everythingWritten(written)).toContain('cp-1');
    expect(everythingWritten(written)).toContain('KeyCode');
  });

  it('is redacted on the invalid-token path, where a mistyped PIN actually lands', () => {
    const { logger, written } = aLogger();

    logger.warn('Invalid ID token format', {
      type: OCPP2_0_1.IdTokenEnumType.KeyCode,
      idToken: KEY_CODE,
      error: 'KeyCode tokens must contain only letters and digits',
    });

    expect(everythingWritten(written)).not.toContain(KEY_CODE);
    // Still says what was wrong with it.
    expect(everythingWritten(written)).toContain('KeyCode tokens must contain only letters');
  });

  it('is redacted through a sub-logger, which is what every handler actually holds', () => {
    const { logger, written } = aLogger();

    logger
      .getSubLogger({ name: 'AuthorizeRequestOcpp21Handler' })
      .info(anAuthorizeRequest({ idToken: KEY_CODE, type: OCPP2_1.IdTokenEnumType.KeyCode }));

    expect(everythingWritten(written)).not.toContain(KEY_CODE);
  });

  it('is redacted when it arrives inside a list, as on a local authorization list', () => {
    const { logger, written } = aLogger();

    logger.info('SendLocalList', {
      localAuthorizationList: [
        { idToken: { idToken: TAG_ID, type: OCPP2_1.IdTokenEnumType.ISO14443 } },
        { idToken: { idToken: KEY_CODE, type: OCPP2_1.IdTokenEnumType.KeyCode } },
      ],
    });

    expect(everythingWritten(written)).not.toContain(KEY_CODE);
    expect(everythingWritten(written)).toContain(TAG_ID);
  });

  it('leaves a readable tag id alone, so ordinary authorization stays debuggable', () => {
    const { logger, written } = aLogger();

    logger.info(
      'AuthorizeRequest received',
      anAuthorizeRequest({ idToken: TAG_ID, type: OCPP2_1.IdTokenEnumType.ISO14443 }),
    );

    expect(everythingWritten(written)).toContain(TAG_ID);
  });

  it('does not alter the message the handler goes on to process', () => {
    // The logger is handed the live request. Redacting in place would mean the CSMS authorized
    // against a placeholder instead of the PIN the driver typed.
    const { logger } = aLogger();
    const message = anAuthorizeRequest({
      idToken: KEY_CODE,
      type: OCPP2_1.IdTokenEnumType.KeyCode,
    });

    logger.info('AuthorizeRequest received', message);

    expect(message.payload.idToken.idToken).toBe(KEY_CODE);
  });
});
