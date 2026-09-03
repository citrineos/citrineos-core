// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi } from 'vitest';
import { type IAuthorizer, type IMessage, DEFAULT_TENANT_ID } from '@citrineos/base';
import {
  type OcppRequest,
  AuthorizationStatusEnum,
  EventGroup,
  IdTokenEnum,
  MessageOrigin,
  MessageState,
  OCPP2_0_1,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import type {
  IAuthorizationRepository,
  IDeviceModelRepository,
} from '@dal/interfaces/repositories.js';
import { AuthorizeRequestOcpp201Handler } from '@handlers/index.js';
import { createTestContainer, makeMockOcppSender } from '@test/testContainer.js';
import type { CertificateAuthorityService } from '@/util/index.js';

function makeMessage<T extends OcppRequest>(payload: T): IMessage<T> {
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
    protocol: OCPPVersion.OCPP2_0_1,
  } as unknown as IMessage<T>;
}

/**
 * A VariableAttribute row as the device model returns it for the Connector.ConnectorType and
 * EVSE.EvseId lookups the restriction checks are driven from.
 */
function anAttribute(evseId: number, value: string) {
  // constructQuery eager-loads EvseType through the Component include, so that is where the
  // handler has to read the EVSE from - the attribute's own evse association is not populated.
  return { value, component: { evse: { id: evseId } } };
}

function makeHandler(options: {
  authorization: Record<string, unknown>;
  connectorTypes?: ReturnType<typeof anAttribute>[];
  evseIds?: ReturnType<typeof anAttribute>[];
}) {
  const { logger } = createTestContainer();
  const ocppSender = makeMockOcppSender();

  const authorizationRepository = {
    readOnlyOneByQuerystring: vi.fn().mockResolvedValue(options.authorization),
  };

  // The handler distinguishes the two device-model lookups by variable_name.
  const deviceModelRepository = {
    readAllByQuerystring: vi.fn().mockImplementation(async (_tenantId, query) => {
      if (query.variable_name === 'ConnectorType') return options.connectorTypes ?? [];
      if (query.variable_name === 'EvseId') return options.evseIds ?? [];
      return [];
    }),
  };

  const handler = new AuthorizeRequestOcpp201Handler({
    logger,
    ocppSender,
    certificateAuthorityService: {} as unknown as CertificateAuthorityService,
    authorizers: [] as IAuthorizer[],
    authorizationRepository: authorizationRepository as unknown as IAuthorizationRepository,
    deviceModelRepository: deviceModelRepository as unknown as IDeviceModelRepository,
  } as never);

  return { handler, ocppSender };
}

function sentResponse(
  ocppSender: ReturnType<typeof makeMockOcppSender>,
): OCPP2_0_1.AuthorizeResponse {
  expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledOnce();
  return ocppSender.sendCallResultWithMessage.mock.calls[0][1] as OCPP2_0_1.AuthorizeResponse;
}

const request: OCPP2_0_1.AuthorizeRequest = {
  idToken: { idToken: 'TAG001', type: OCPP2_0_1.IdTokenEnumType.Central },
};

const acceptedAuthorization = {
  idToken: 'TAG001',
  idTokenType: IdTokenEnum.Central,
  status: AuthorizationStatusEnum.Accepted,
};

describe('AuthorizeRequestOcpp201Handler EVSE restrictions', () => {
  describe('allowedConnectorTypes', () => {
    it('allows an EVSE whose connector type is the only allowed type', async () => {
      const { handler, ocppSender } = makeHandler({
        authorization: { ...acceptedAuthorization, allowedConnectorTypes: ['cCCS2'] },
        connectorTypes: [anAttribute(1, 'cCCS2')],
      });

      await handler.handle(makeMessage(request));

      const response = sentResponse(ocppSender);
      expect(response.idTokenInfo.status).toBe(AuthorizationStatusEnum.Accepted);
      expect(response.idTokenInfo.evseId).toEqual([1]);
    });

    it('allows an EVSE whose connector type is the first of several allowed types', async () => {
      const { handler, ocppSender } = makeHandler({
        authorization: {
          ...acceptedAuthorization,
          allowedConnectorTypes: ['cCCS2', 'cMCS'],
        },
        connectorTypes: [anAttribute(1, 'cCCS2')],
      });

      await handler.handle(makeMessage(request));

      expect(sentResponse(ocppSender).idTokenInfo.status).toBe(AuthorizationStatusEnum.Accepted);
    });

    it('refuses with NotAllowedTypeEVSE when no EVSE has an allowed connector type', async () => {
      const { handler, ocppSender } = makeHandler({
        authorization: { ...acceptedAuthorization, allowedConnectorTypes: ['cMCS'] },
        connectorTypes: [anAttribute(1, 'cCCS2')],
      });

      await handler.handle(makeMessage(request));

      expect(sentResponse(ocppSender).idTokenInfo.status).toBe(
        AuthorizationStatusEnum.NotAllowedTypeEVSE,
      );
    });

    it('restricts the response to only the EVSEs with an allowed connector type', async () => {
      const { handler, ocppSender } = makeHandler({
        authorization: { ...acceptedAuthorization, allowedConnectorTypes: ['cMCS'] },
        connectorTypes: [anAttribute(1, 'cCCS2'), anAttribute(2, 'cMCS')],
      });

      await handler.handle(makeMessage(request));

      const response = sentResponse(ocppSender);
      expect(response.idTokenInfo.status).toBe(AuthorizationStatusEnum.Accepted);
      expect(response.idTokenInfo.evseId).toEqual([2]);
    });
  });

  describe('disallowedEvseIdPrefixes', () => {
    it('allows the EVSEs that do not carry a disallowed prefix', async () => {
      const { handler, ocppSender } = makeHandler({
        authorization: { ...acceptedAuthorization, disallowedEvseIdPrefixes: ['UK*DEP*'] },
        evseIds: [anAttribute(1, 'UK*DEP*E001'), anAttribute(2, 'UK*VLT*E002')],
      });

      await handler.handle(makeMessage(request));

      const response = sentResponse(ocppSender);
      expect(response.idTokenInfo.status).toBe(AuthorizationStatusEnum.Accepted);
      expect(response.idTokenInfo.evseId).toEqual([2]);
    });

    it('refuses with NotAtThisLocation when every EVSE carries a disallowed prefix', async () => {
      const { handler, ocppSender } = makeHandler({
        authorization: { ...acceptedAuthorization, disallowedEvseIdPrefixes: ['UK*DEP*'] },
        evseIds: [anAttribute(1, 'UK*DEP*E001')],
      });

      await handler.handle(makeMessage(request));

      expect(sentResponse(ocppSender).idTokenInfo.status).toBe(
        AuthorizationStatusEnum.NotAtThisLocation,
      );
    });

    it('removes a disallowed EVSE from the set the connector-type check allowed', async () => {
      const { handler, ocppSender } = makeHandler({
        authorization: {
          ...acceptedAuthorization,
          allowedConnectorTypes: ['cMCS'],
          disallowedEvseIdPrefixes: ['UK*DEP*'],
        },
        connectorTypes: [anAttribute(1, 'cMCS'), anAttribute(2, 'cMCS')],
        evseIds: [anAttribute(1, 'UK*DEP*E001'), anAttribute(2, 'UK*VLT*E002')],
      });

      await handler.handle(makeMessage(request));

      const response = sentResponse(ocppSender);
      expect(response.idTokenInfo.status).toBe(AuthorizationStatusEnum.Accepted);
      expect(response.idTokenInfo.evseId).toEqual([2]);
    });
  });

  it('places no evseId restriction on an authorization that carries neither list', async () => {
    const { handler, ocppSender } = makeHandler({
      authorization: acceptedAuthorization,
      connectorTypes: [anAttribute(1, 'cCCS2')],
      evseIds: [anAttribute(1, 'UK*VLT*E001')],
    });

    await handler.handle(makeMessage(request));

    const response = sentResponse(ocppSender);
    expect(response.idTokenInfo.status).toBe(AuthorizationStatusEnum.Accepted);
    expect(response.idTokenInfo.evseId).toBeUndefined();
  });
});
