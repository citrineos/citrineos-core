// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type IMessage, DEFAULT_TENANT_ID } from '@citrineos/base';
import {
  type OcppRequest,
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP2_0_1,
  OCPP2_1,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import type {
  IAuthorizationRepository,
  IDeviceModelRepository,
  ITariffRepository,
} from '@citrineos/dal';
import {
  AuthorizeRequestOcpp201Handler,
  AuthorizeRequestOcpp21Handler,
} from '@handlers/index.js';
import type { CertificateAuthorityService } from '@/services/index.js';
import { createTestContainer, makeMockOcppSender } from '@test/test-container.js';

/**
 * C04.FR.04: "If an idToken of type keyCode is used -> The Charging Station or CSMS SHALL NOT show
 * the IdToken in any logging. key codes should never appear in logs."
 *
 * A key code is a PIN the driver typed at the Charging Station, and a mistyped one is exactly the
 * case that reaches the invalid-format branch.
 */
const KEY_CODE = 'PIN#1234';

function makeMessage<T extends OcppRequest>(
  payload: T,
  protocol: OCPPVersion,
): IMessage<T> {
  return {
    context: {
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: 'station-001',
      correlationId: 'corr-001',
      timestamp: new Date().toISOString(),
    },
    payload,
    origin: MessageOrigin.ChargingStation,
    eventGroup: EventGroup.EVDriver,
    action: OCPP_CallAction.Authorize,
    state: MessageState.Request,
    protocol,
  } as unknown as IMessage<T>;
}

function everythingLogged(logger: {
  debug: ReturnType<typeof vi.fn>;
  info: ReturnType<typeof vi.fn>;
  warn: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
}): string {
  return [logger.debug, logger.info, logger.warn, logger.error]
    .flatMap((fn) => fn.mock.calls)
    .map((call) => JSON.stringify(call))
    .join('\n');
}

describe('C04.FR.04 - a key code never reaches the log', () => {
  let container: ReturnType<typeof createTestContainer>['container'];
  let logger: ReturnType<typeof createTestContainer>['logger'];
  let ocppSender: ReturnType<typeof makeMockOcppSender>;

  beforeEach(() => {
    ({ container, logger } = createTestContainer());
    void container;
    ocppSender = makeMockOcppSender();
  });

  it('OCPP 2.0.1: refuses the malformed key code without logging it', async () => {
    const handler = new AuthorizeRequestOcpp201Handler({
      logger,
      ocppSender,
      certificateAuthorityService: {} as unknown as CertificateAuthorityService,
      authorizers: [],
      authorizationRepository: {
        readOnlyOneByQuerystring: vi.fn().mockResolvedValue(null),
      } as unknown as IAuthorizationRepository,
      deviceModelRepository: {
        readAllByQuerystring: vi.fn().mockResolvedValue([]),
      } as unknown as IDeviceModelRepository,
    });

    await handler.handle(
      makeMessage(
        {
          idToken: { idToken: KEY_CODE, type: OCPP2_0_1.IdTokenEnumType.KeyCode },
        } as OCPP2_0_1.AuthorizeRequest,
        OCPPVersion.OCPP2_0_1,
      ),
    );

    expect(ocppSender.sendCallErrorWithMessage).toHaveBeenCalledOnce();
    expect(everythingLogged(logger)).not.toContain(KEY_CODE);
  });

  it('OCPP 2.1: refuses the malformed key code without logging it', async () => {
    const handler = new AuthorizeRequestOcpp21Handler({
      logger,
      ocppSender,
      certificateAuthorityService: {} as unknown as CertificateAuthorityService,
      authorizers: [],
      authorizationRepository: {
        readOnlyOneByQuerystring: vi.fn().mockResolvedValue(null),
      } as unknown as IAuthorizationRepository,
      deviceModelRepository: {
        readAllByQuerystring: vi.fn().mockResolvedValue([]),
      } as unknown as IDeviceModelRepository,
      tariffRepository: { readByKey: vi.fn() } as unknown as ITariffRepository,
    });

    await handler.handle(
      makeMessage(
        {
          idToken: { idToken: KEY_CODE, type: OCPP2_1.IdTokenEnumType.KeyCode },
        } as OCPP2_1.AuthorizeRequest,
        OCPPVersion.OCPP2_1,
      ),
    );

    expect(ocppSender.sendCallErrorWithMessage).toHaveBeenCalledOnce();
    expect(everythingLogged(logger)).not.toContain(KEY_CODE);
  });

  it('still says what was wrong with it', async () => {
    const handler = new AuthorizeRequestOcpp21Handler({
      logger,
      ocppSender,
      certificateAuthorityService: {} as unknown as CertificateAuthorityService,
      authorizers: [],
      authorizationRepository: {
        readOnlyOneByQuerystring: vi.fn().mockResolvedValue(null),
      } as unknown as IAuthorizationRepository,
      deviceModelRepository: {
        readAllByQuerystring: vi.fn().mockResolvedValue([]),
      } as unknown as IDeviceModelRepository,
      tariffRepository: { readByKey: vi.fn() } as unknown as ITariffRepository,
    });

    await handler.handle(
      makeMessage(
        {
          idToken: { idToken: KEY_CODE, type: OCPP2_1.IdTokenEnumType.KeyCode },
        } as OCPP2_1.AuthorizeRequest,
        OCPPVersion.OCPP2_1,
      ),
    );

    const logged = everythingLogged(logger);
    expect(logged).toContain('KeyCode');
    expect(logged).toContain('KeyCode tokens must contain only letters');
  });
});
