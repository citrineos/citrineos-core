// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type IMessage, DEFAULT_TENANT_ID } from '@citrineos/base';
import {
  type OcppRequest,
  AuthorizationStatusEnum,
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP2_1,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import type {
  IAuthorizationRepository,
  IVariableAttributeRepository,
  ITariffRepository,
} from '@citrineos/dal';
import { AuthorizeRequestOcpp21Handler } from '@handlers/index.js';
import type { CertificateAuthorityService } from '@services/index.js';
import { createTestContainer, makeMockOcppSender } from '@test/test-container.js';

const TARIFF_ID = 7;

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
    protocol: OCPPVersion.OCPP2_1,
  } as unknown as IMessage<T>;
}

function anAuthorizeRequest(): OCPP2_1.AuthorizeRequest {
  return {
    idToken: { idToken: 'TOKEN01', type: OCPP2_1.IdTokenEnumType.Central },
  } as OCPP2_1.AuthorizeRequest;
}

describe('AuthorizeRequestOcpp21Handler', () => {
  /**
   * I08.FR.01 lets the CSMS answer with a driver-specific tariff, but a station that does not do
   * local cost calculation cannot use one - TariffCostCtrlr.Enabled[Tariff] is what says whether it
   * does (Part 2, Tariff and Cost, Configuration Settings). Device model values arrive as strings,
   * and OCPP spells a boolean "false" (Part 2 §2.1.4), which is truthy.
   */
  describe('driver tariff in the AuthorizeResponse', () => {
    let ocppSender: ReturnType<typeof makeMockOcppSender>;
    let variableAttributeRepository: { readAllByQuerystring: ReturnType<typeof vi.fn> };
    let handler: AuthorizeRequestOcpp21Handler;

    function makeHandler(tariffEnabled: string | null | undefined) {
      const { logger } = createTestContainer();
      ocppSender = makeMockOcppSender();

      variableAttributeRepository = {
        readAllByQuerystring: vi.fn().mockImplementation(async (_tenantId, query) => {
          if (query.component_name === 'TariffCostCtrlr' && query.variable_name === 'Enabled') {
            return tariffEnabled === undefined ? [] : [{ value: tariffEnabled }];
          }
          return [];
        }),
      };

      const authorizationRepository = {
        readOnlyOneByQuerystring: vi.fn().mockResolvedValue({
          idToken: 'TOKEN01',
          status: AuthorizationStatusEnum.Accepted,
          tariffId: TARIFF_ID,
        }),
      };

      const tariffRepository = {
        findById: vi.fn().mockResolvedValue({
          id: TARIFF_ID,
          tariffId: 'DriverTariff01',
          currency: 'EUR',
          validFrom: '2026-01-01T00:00:00Z',
        }),
      };

      return new AuthorizeRequestOcpp21Handler({
        logger,
        ocppSender,
        certificateAuthorityService: {} as unknown as CertificateAuthorityService,
        authorizers: [],
        authorizationRepository: authorizationRepository as unknown as IAuthorizationRepository,
        variableAttributeRepository:
          variableAttributeRepository as unknown as IVariableAttributeRepository,
        tariffRepository: tariffRepository as unknown as ITariffRepository,
      });
    }

    async function authorizeWithTariffEnabled(tariffEnabled: string | null | undefined) {
      handler = makeHandler(tariffEnabled);
      await handler.handle(makeMessage(anAuthorizeRequest()));
      return ocppSender.sendCallResultWithMessage.mock.calls[0][1] as OCPP2_1.AuthorizeResponse;
    }

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('does not send a tariff to a station that reports local cost calculation off', async () => {
      const response = await authorizeWithTariffEnabled('false');

      expect(response.idTokenInfo?.status).toBe(AuthorizationStatusEnum.Accepted);
      expect(response.tariff).toBeUndefined();
    });

    it('does not send a tariff to a station that never reported the variable', async () => {
      const response = await authorizeWithTariffEnabled(undefined);

      expect(response.tariff).toBeUndefined();
    });

    it('sends the driver tariff when the station does calculate cost locally', async () => {
      const response = await authorizeWithTariffEnabled('true');

      expect(response.tariff?.tariffId).toBe('DriverTariff01');
    });

    // I08.FR.09: driver-specific tariffs have no validFrom date.
    it('strips validFrom from the tariff it sends', async () => {
      const response = await authorizeWithTariffEnabled('true');

      expect(response.tariff).toBeDefined();
      expect(response.tariff).not.toHaveProperty('validFrom');
    });
  });

  describe('contract certificate status', () => {
    async function authorizeWithCertificate(
      certificateStatus: OCPP2_1.AuthorizeCertificateStatusEnumType,
      authorization?: object,
    ) {
      const { logger } = createTestContainer();
      const ocppSender = makeMockOcppSender();
      const handler = new AuthorizeRequestOcpp21Handler({
        logger,
        ocppSender,
        certificateAuthorityService: {
          validateCertificateChainPem: vi.fn().mockResolvedValue(certificateStatus),
        } as unknown as CertificateAuthorityService,
        authorizers: [],
        authorizationRepository: {
          readOnlyOneByQuerystring: vi.fn().mockResolvedValue(authorization),
        } as unknown as IAuthorizationRepository,
        variableAttributeRepository: {
          readAllByQuerystring: vi.fn().mockResolvedValue([]),
        } as unknown as IVariableAttributeRepository,
        tariffRepository: {} as unknown as ITariffRepository,
      });

      await handler.handle(
        makeMessage({ ...anAuthorizeRequest(), certificate: 'A_CONTRACT_CERTIFICATE_CHAIN' }),
      );
      return ocppSender.sendCallResultWithMessage.mock.calls[0][1] as OCPP2_1.AuthorizeResponse;
    }

    it('reports the token expired when the contract certificate has expired', async () => {
      const response = await authorizeWithCertificate(
        OCPP2_1.AuthorizeCertificateStatusEnumType.CertificateExpired,
      );

      expect(response.certificateStatus).toBe(
        OCPP2_1.AuthorizeCertificateStatusEnumType.CertificateExpired,
      );
      expect(response.idTokenInfo.status).toBe(AuthorizationStatusEnum.Expired);
    });

    it('cancels the contract of an eMAID the CSMS does not know', async () => {
      const response = await authorizeWithCertificate(
        OCPP2_1.AuthorizeCertificateStatusEnumType.Accepted,
      );

      expect(response.certificateStatus).toBe(
        OCPP2_1.AuthorizeCertificateStatusEnumType.ContractCancelled,
      );
      expect(response.idTokenInfo.status).toBe(AuthorizationStatusEnum.Unknown);
    });

    it('cancels the contract of a blocked eMAID', async () => {
      const response = await authorizeWithCertificate(
        OCPP2_1.AuthorizeCertificateStatusEnumType.Accepted,
        { idToken: 'TOKEN01', status: AuthorizationStatusEnum.Blocked },
      );

      expect(response.certificateStatus).toBe(
        OCPP2_1.AuthorizeCertificateStatusEnumType.ContractCancelled,
      );
      expect(response.idTokenInfo.status).toBe(AuthorizationStatusEnum.Blocked);
    });
  });
});
