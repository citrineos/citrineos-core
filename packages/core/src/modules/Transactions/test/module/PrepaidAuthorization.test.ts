// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AuthorizationStatusEnum,
  DEFAULT_TENANT_ID,
  IAuthorizer,
  OCPP2_0_1,
  OCPP2_1,
} from '@citrineos/base';
import {
  IAuthorizationRepository,
  ILocationRepository,
  IOCPPMessageRepository,
  IReservationRepository,
  ITransactionEventRepository,
} from '@citrineos/core';
import { TransactionService } from '../../src/module/TransactionService.js';
import { anAuthorization } from '../providers/AuthorizationProvider.js';
import { anIdToken } from '../providers/IdTokenProvider.js';

import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { createTestContainer, getTestInstance } from '../../../../test/testContainer.js';
import { aMessageContext } from '../providers/MessageContextProvider.js';
import { aTransactionEventRequest } from '../providers/TransactionProvider.js';

describe('C17 - Prepaid Card Authorization', () => {
  const { container } = createTestContainer();
  let transactionService: TransactionService;
  let authorizationRepository: Mocked<IAuthorizationRepository>;
  let transactionEventRepository: Mocked<ITransactionEventRepository>;
  let locationRepository: Mocked<ILocationRepository>;
  let reservationRepository: Mocked<IReservationRepository>;
  let ocppMessageRepository: Mocked<IOCPPMessageRepository>;
  let authorizer: Mocked<IAuthorizer>;
  let realTimeAuthorizer: Mocked<IAuthorizer>;

  beforeEach(() => {
    authorizationRepository = {
      readAllByQuerystring: vi.fn(),
      readOnlyOneByQuery: vi.fn(),
    } as unknown as Mocked<IAuthorizationRepository>;

    transactionEventRepository = {
      readAllActiveTransactionsByAuthorizationId: vi.fn().mockResolvedValue([]),
    } as unknown as Mocked<ITransactionEventRepository>;

    locationRepository = {
      readConnectorByStationIdAndOcpp16ConnectorId: vi.fn(),
      readConnectorByStationIdAndOcpp201EvseType: vi.fn(),
      readEvseByStationIdAndOcpp201EvseId: vi.fn(),
    } as unknown as Mocked<ILocationRepository>;

    reservationRepository = {} as unknown as Mocked<IReservationRepository>;

    ocppMessageRepository = {} as unknown as Mocked<IOCPPMessageRepository>;

    authorizer = {
      authorize: vi.fn().mockResolvedValue(AuthorizationStatusEnum.Accepted),
    } as Mocked<IAuthorizer>;

    realTimeAuthorizer = {
      authorize: vi.fn().mockResolvedValue(AuthorizationStatusEnum.Accepted),
    } as Mocked<IAuthorizer>;

    transactionService = getTestInstance(container, TransactionService, {
      transactionEventRepository,
      authorizationRepository,
      locationRepository,
      reservationRepository,
      ocppMessageRepository,
      realTimeAuthorizer,
      authorizers: [authorizer],
    });
  });

  describe('C17.FR.01 - Prepaid token with positive balance (OCPP 2.1)', () => {
    it('should return Accepted with cacheExpiryDateTime set to now for prepaid token with positive balance', async () => {
      const authorization = anAuthorization((auth) => {
        auth.status = AuthorizationStatusEnum.Accepted;
        auth.isPrepaid = true;
        auth.prepaidBalance = 25.5;
        auth.cacheExpiryDateTime = undefined;
      });
      authorizationRepository.readAllByQuerystring.mockResolvedValue([authorization]);

      const transactionEventRequest = aTransactionEventRequest((item) => {
        item.idToken = anIdToken();
        item.eventType = OCPP2_1.TransactionEventEnumType.Started;
      });
      const messageContext = aMessageContext();
      const beforeTime = new Date();

      const response = await transactionService.authorizeOcpp21IdToken(
        DEFAULT_TENANT_ID,
        transactionEventRequest,
        messageContext,
      );

      expect(response.idTokenInfo?.status).toBe(OCPP2_1.AuthorizationStatusEnumType.Accepted);
      expect(response.idTokenInfo?.cacheExpiryDateTime).toBeDefined();
      // Verify cacheExpiryDateTime is approximately now (within 5 seconds)
      const cacheExpiry = new Date(response.idTokenInfo!.cacheExpiryDateTime!);
      expect(cacheExpiry.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(cacheExpiry.getTime()).toBeLessThanOrEqual(Date.now() + 5000);
    });
  });

  describe('C17.FR.02 - Prepaid token with zero or negative balance (OCPP 2.1)', () => {
    it('should return NoCredit with cacheExpiryDateTime set to now for prepaid token with zero balance', async () => {
      const authorization = anAuthorization((auth) => {
        auth.status = AuthorizationStatusEnum.Accepted;
        auth.isPrepaid = true;
        auth.prepaidBalance = 0;
        auth.cacheExpiryDateTime = undefined;
      });
      authorizationRepository.readAllByQuerystring.mockResolvedValue([authorization]);

      const transactionEventRequest = aTransactionEventRequest((item) => {
        item.idToken = anIdToken();
        item.eventType = OCPP2_1.TransactionEventEnumType.Started;
      });
      const messageContext = aMessageContext();

      const response = await transactionService.authorizeOcpp21IdToken(
        DEFAULT_TENANT_ID,
        transactionEventRequest,
        messageContext,
      );

      expect(response.idTokenInfo?.status).toBe(OCPP2_1.AuthorizationStatusEnumType.NoCredit);
      expect(response.idTokenInfo?.cacheExpiryDateTime).toBeDefined();
    });

    it('should return NoCredit for prepaid token with negative balance', async () => {
      const authorization = anAuthorization((auth) => {
        auth.status = AuthorizationStatusEnum.Accepted;
        auth.isPrepaid = true;
        auth.prepaidBalance = -5.0;
        auth.cacheExpiryDateTime = undefined;
      });
      authorizationRepository.readAllByQuerystring.mockResolvedValue([authorization]);

      const transactionEventRequest = aTransactionEventRequest((item) => {
        item.idToken = anIdToken();
        item.eventType = OCPP2_1.TransactionEventEnumType.Started;
      });
      const messageContext = aMessageContext();

      const response = await transactionService.authorizeOcpp21IdToken(
        DEFAULT_TENANT_ID,
        transactionEventRequest,
        messageContext,
      );

      expect(response.idTokenInfo?.status).toBe(OCPP2_1.AuthorizationStatusEnumType.NoCredit);
    });

    it('should return NoCredit for prepaid token with null balance', async () => {
      const authorization = anAuthorization((auth) => {
        auth.status = AuthorizationStatusEnum.Accepted;
        auth.isPrepaid = true;
        auth.prepaidBalance = null;
        auth.cacheExpiryDateTime = undefined;
      });
      authorizationRepository.readAllByQuerystring.mockResolvedValue([authorization]);

      const transactionEventRequest = aTransactionEventRequest((item) => {
        item.idToken = anIdToken();
        item.eventType = OCPP2_1.TransactionEventEnumType.Started;
      });
      const messageContext = aMessageContext();

      const response = await transactionService.authorizeOcpp21IdToken(
        DEFAULT_TENANT_ID,
        transactionEventRequest,
        messageContext,
      );

      expect(response.idTokenInfo?.status).toBe(OCPP2_1.AuthorizationStatusEnumType.NoCredit);
    });
  });

  describe('C17.FR.03 - TransactionLimit with maxCost for OCPP 2.1', () => {
    it('should include transactionLimit.maxCost set to prepaid balance', async () => {
      const authorization = anAuthorization((auth) => {
        auth.status = AuthorizationStatusEnum.Accepted;
        auth.isPrepaid = true;
        auth.prepaidBalance = 12.34;
        auth.cacheExpiryDateTime = undefined;
      });
      authorizationRepository.readAllByQuerystring.mockResolvedValue([authorization]);

      const transactionEventRequest = aTransactionEventRequest((item) => {
        item.idToken = anIdToken();
        item.eventType = OCPP2_1.TransactionEventEnumType.Started;
      });
      const messageContext = aMessageContext();

      const response = await transactionService.authorizeOcpp21IdToken(
        DEFAULT_TENANT_ID,
        transactionEventRequest,
        messageContext,
      );

      expect(response.idTokenInfo?.status).toBe(OCPP2_1.AuthorizationStatusEnumType.Accepted);
      expect(response.transactionLimit).toBeDefined();
      expect(response.transactionLimit!.maxCost).toBe(12.34);
    });

    it('should not include transactionLimit when prepaid balance is zero', async () => {
      const authorization = anAuthorization((auth) => {
        auth.status = AuthorizationStatusEnum.Accepted;
        auth.isPrepaid = true;
        auth.prepaidBalance = 0;
        auth.cacheExpiryDateTime = undefined;
      });
      authorizationRepository.readAllByQuerystring.mockResolvedValue([authorization]);

      const transactionEventRequest = aTransactionEventRequest((item) => {
        item.idToken = anIdToken();
        item.eventType = OCPP2_1.TransactionEventEnumType.Started;
      });
      const messageContext = aMessageContext();

      const response = await transactionService.authorizeOcpp21IdToken(
        DEFAULT_TENANT_ID,
        transactionEventRequest,
        messageContext,
      );

      expect(response.idTokenInfo?.status).toBe(OCPP2_1.AuthorizationStatusEnumType.NoCredit);
      expect(response.transactionLimit).toBeUndefined();
    });
  });

  describe('OCPP 2.0.1 - Prepaid tokens should not have C17 logic', () => {
    it('should not apply prepaid logic for OCPP 2.0.1 authorizeOcpp201IdToken', async () => {
      const authorization = anAuthorization((auth) => {
        auth.status = AuthorizationStatusEnum.Accepted;
        auth.isPrepaid = true;
        auth.prepaidBalance = 25.5;
        auth.cacheExpiryDateTime = undefined;
      });
      authorizationRepository.readAllByQuerystring.mockResolvedValue([authorization]);

      const transactionEventRequest = aTransactionEventRequest((item) => {
        item.idToken = anIdToken();
        item.eventType = OCPP2_0_1.TransactionEventEnumType.Started;
      });
      const messageContext = aMessageContext();

      const response = await transactionService.authorizeOcpp201IdToken(
        DEFAULT_TENANT_ID,
        transactionEventRequest,
        messageContext,
      );

      expect(response.idTokenInfo?.status).toBe(OCPP2_0_1.AuthorizationStatusEnumType.Accepted);
      // No C17 prepaid logic should be applied for 2.0.1
      expect((response as any).transactionLimit).toBeUndefined();
    });
  });

  describe('Non-prepaid tokens are unaffected', () => {
    it('should not apply prepaid logic for non-prepaid token', async () => {
      const authorization = anAuthorization((auth) => {
        auth.status = AuthorizationStatusEnum.Accepted;
        auth.isPrepaid = false;
        auth.prepaidBalance = undefined;
        auth.cacheExpiryDateTime = undefined;
      });
      authorizationRepository.readAllByQuerystring.mockResolvedValue([authorization]);

      const transactionEventRequest = aTransactionEventRequest((item) => {
        item.idToken = anIdToken();
        item.eventType = OCPP2_1.TransactionEventEnumType.Started;
      });
      const messageContext = aMessageContext();

      const response = await transactionService.authorizeOcpp21IdToken(
        DEFAULT_TENANT_ID,
        transactionEventRequest,
        messageContext,
      );

      expect(response.idTokenInfo?.status).toBe(OCPP2_1.AuthorizationStatusEnumType.Accepted);
      expect(response.transactionLimit).toBeUndefined();
    });

    it('should not apply prepaid logic when isPrepaid is undefined', async () => {
      const authorization = anAuthorization((auth) => {
        auth.status = AuthorizationStatusEnum.Accepted;
        auth.cacheExpiryDateTime = undefined;
      });
      authorizationRepository.readAllByQuerystring.mockResolvedValue([authorization]);

      const transactionEventRequest = aTransactionEventRequest((item) => {
        item.idToken = anIdToken();
        item.eventType = OCPP2_1.TransactionEventEnumType.Started;
      });
      const messageContext = aMessageContext();

      const response = await transactionService.authorizeOcpp21IdToken(
        DEFAULT_TENANT_ID,
        transactionEventRequest,
        messageContext,
      );

      expect(response.idTokenInfo?.status).toBe(OCPP2_1.AuthorizationStatusEnumType.Accepted);
      expect(response.transactionLimit).toBeUndefined();
    });
  });
});
