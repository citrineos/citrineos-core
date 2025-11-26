// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AuthorizationStatusEnum,
  DEFAULT_TENANT_ID,
  IAuthorizer,
  OCPP1_6,
  OCPP2_0_1,
} from '@citrineos/base';
import {
  IAuthorizationRepository,
  IOCPPMessageRepository,
  IReservationRepository,
  ITransactionEventRepository,
} from '@citrineos/data';
import { TransactionService } from '../../src/module/TransactionService.js';
import { anAuthorization } from '../providers/AuthorizationProvider.js';
import { anIdToken } from '../providers/IdTokenProvider.js';

import { faker } from '@faker-js/faker';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { aMessageContext } from '../providers/MessageContextProvider.js';
import { aTransaction, aTransactionEventRequest } from '../providers/TransactionProvider.js';

describe('TransactionService', () => {
  let transactionService: TransactionService;
  let authorizationRepository: Mocked<IAuthorizationRepository>;
  let transactionEventRepository: Mocked<ITransactionEventRepository>;
  let reservationRepository: Mocked<IReservationRepository>;
  let ocppMessageRepository: Mocked<IOCPPMessageRepository>;
  let authorizer: Mocked<IAuthorizer>;
  let realTimeAuthorizer: Mocked<IAuthorizer>;

  beforeEach(() => {
    authorizationRepository = {
      readAllByQuerystring: vi.fn(),
      readOnlyOneByQuery: vi.fn().mockResolvedValue({ idToken: 1 }),
    } as unknown as Mocked<IAuthorizationRepository>;

    transactionEventRepository = {
      readAllActiveTransactionsByAuthorizationId: vi.fn(),
    } as unknown as Mocked<ITransactionEventRepository>;

    reservationRepository = {} as unknown as Mocked<IReservationRepository>;

    ocppMessageRepository = {} as unknown as Mocked<IOCPPMessageRepository>;

    authorizer = {
      authorize: vi.fn(),
    } as Mocked<IAuthorizer>;

    realTimeAuthorizer = {
      authorize: vi.fn(),
    } as Mocked<IAuthorizer>;

    transactionService = new TransactionService(
      transactionEventRepository,
      authorizationRepository,
      reservationRepository,
      ocppMessageRepository,
      realTimeAuthorizer,
      [authorizer],
    );
  });

  it('should return Unknown status when authorizations length is not 1', async () => {
    authorizationRepository.readAllByQuerystring.mockResolvedValue([]);

    const transactionEventRequest = aTransactionEventRequest((item) => {
      item.idToken = anIdToken();
    });
    const messageContext = aMessageContext();
    const response = await transactionService.authorizeOcpp201IdToken(
      DEFAULT_TENANT_ID,
      transactionEventRequest,
      messageContext,
    );

    expect(response.idTokenInfo!.status).toBe(OCPP2_0_1.AuthorizationStatusEnumType.Unknown);
  });

  it('should return status from idTokenInfo when not Accepted', async () => {
    const authorization = anAuthorization((auth) => {
      auth.status = AuthorizationStatusEnum.Blocked;
    });
    authorizationRepository.readAllByQuerystring.mockResolvedValue([authorization]);

    const transactionEventRequest = aTransactionEventRequest((item) => {
      item.idToken = {
        idToken: faker.string.uuid(),
        type: OCPP2_0_1.IdTokenEnumType.Central,
      };
      item.eventType = OCPP2_0_1.TransactionEventEnumType.Started;
    });
    const messageContext = aMessageContext();
    const response = await transactionService.authorizeOcpp201IdToken(
      DEFAULT_TENANT_ID,
      transactionEventRequest,
      messageContext,
    );

    expect(response.idTokenInfo?.status).toBe(OCPP2_0_1.AuthorizationStatusEnumType.Blocked);
  });

  it('should return Invalid status when cacheExpiryDateTime is expired', async () => {
    const expiredDate = new Date(Date.now() - 1000).toISOString();
    const authorization = anAuthorization((auth) => {
      auth.status = AuthorizationStatusEnum.Accepted;
      auth.cacheExpiryDateTime = expiredDate;
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

    expect(response.idTokenInfo?.status).toBe(OCPP2_0_1.AuthorizationStatusEnumType.Invalid);
  });

  it('should not return ConcurrentTx status when there are concurrent transactions and concurrentTx is false', async () => {
    const authorization = anAuthorization((auth) => {
      auth.status = AuthorizationStatusEnum.Accepted;
    });
    authorizationRepository.readAllByQuerystring.mockResolvedValue([authorization]);
    transactionEventRepository.readAllActiveTransactionsByAuthorizationId.mockResolvedValue([
      aTransaction(),
      aTransaction(),
    ]);
    authorizer.authorize.mockResolvedValue(AuthorizationStatusEnum.Accepted);
    realTimeAuthorizer.authorize.mockResolvedValue(AuthorizationStatusEnum.Accepted);

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
  });

  it('should return ConcurrentTx status when there are concurrent transactions and concurrentTx is true', async () => {
    const authorization = anAuthorization((auth) => {
      auth.concurrentTransaction = true;
      auth.status = AuthorizationStatusEnum.Accepted;
    });
    authorizationRepository.readAllByQuerystring.mockResolvedValue([authorization]);
    transactionEventRepository.readAllActiveTransactionsByAuthorizationId.mockResolvedValue([
      aTransaction(),
      aTransaction(),
    ]);
    authorizer.authorize.mockResolvedValue(AuthorizationStatusEnum.Accepted);
    realTimeAuthorizer.authorize.mockResolvedValue(AuthorizationStatusEnum.Accepted);

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

    expect(response.idTokenInfo?.status).toBe(OCPP2_0_1.AuthorizationStatusEnumType.ConcurrentTx);
  });

  it('should apply authorizers when status is Accepted and transaction is started', async () => {
    const authorization = anAuthorization((auth) => {
      auth.status = AuthorizationStatusEnum.Accepted;
    });
    authorizationRepository.readAllByQuerystring.mockResolvedValue([authorization]);
    transactionEventRepository.readAllActiveTransactionsByAuthorizationId.mockResolvedValue([]);
    authorizer.authorize.mockResolvedValue(AuthorizationStatusEnum.Accepted);
    realTimeAuthorizer.authorize.mockResolvedValue(AuthorizationStatusEnum.Accepted);

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

    expect(authorizer.authorize).toHaveBeenCalled();
    expect(response.idTokenInfo?.status).toBe(OCPP2_0_1.AuthorizationStatusEnumType.Accepted);
  });

  describe('Tests for authorizeOcpp16IdToken', () => {
    it('should return Accepted status when idToken exists and idTokenInfo is valid', async () => {
      const authorization = anAuthorization();
      authorizationRepository.readAllByQuerystring.mockResolvedValue([authorization]);
      transactionEventRepository.readAllActiveTransactionsByAuthorizationId.mockResolvedValue([]);
      authorizer.authorize.mockResolvedValue(AuthorizationStatusEnum.Accepted);
      realTimeAuthorizer.authorize.mockResolvedValue(AuthorizationStatusEnum.Accepted);

      // Use the same idToken as the mock authorization
      const messageContext = aMessageContext();
      const response = await transactionService.authorizeOcpp16IdToken(
        messageContext,
        authorization.idToken,
      );

      expect(response.idTagInfo.status).toBe(OCPP1_6.StartTransactionResponseStatus.Accepted);
      expect(response.idTagInfo.parentIdTag).toBe(authorization.groupAuthorizationId);
      expect(response.idTagInfo.expiryDate).toBe(authorization.cacheExpiryDateTime);
    });

    it('should return Blocked status when idTokenInfo is blocked', async () => {
      const authorization = anAuthorization((auth) => {
        auth.status = AuthorizationStatusEnum.Blocked;
      });
      authorizationRepository.readAllByQuerystring.mockResolvedValue([authorization]);

      const messageContext = aMessageContext();
      const response = await transactionService.authorizeOcpp16IdToken(
        messageContext,
        faker.string.uuid(),
      );

      expect(response.idTagInfo.status).toBe(OCPP1_6.StartTransactionResponseStatus.Blocked);
      expect(response.idTagInfo.parentIdTag).toBeUndefined();
      expect(response.idTagInfo.expiryDate).toBeUndefined();
    });

    it('should return Expired status when idTokenInfo.cacheExpiryDateTime is smaller than now', async () => {
      const authorization = anAuthorization((auth) => {
        auth.cacheExpiryDateTime = faker.date.past().toISOString();
      });
      authorizationRepository.readAllByQuerystring.mockResolvedValue([authorization]);

      const messageContext = aMessageContext();
      const response = await transactionService.authorizeOcpp16IdToken(
        messageContext,
        faker.string.uuid(),
      );

      expect(response.idTagInfo.status).toBe(OCPP1_6.StartTransactionResponseStatus.Expired);
      expect(response.idTagInfo.parentIdTag).toBeUndefined();
      expect(response.idTagInfo.expiryDate).toBeUndefined();
    });

    it('should return ConcurrentTx status when an active transaction exists', async () => {
      const authorization = anAuthorization();
      authorizationRepository.readAllByQuerystring.mockResolvedValue([authorization]);
      transactionEventRepository.readAllActiveTransactionsByAuthorizationId.mockResolvedValue([
        aTransaction(),
      ]);

      const messageContext = aMessageContext();
      const response = await transactionService.authorizeOcpp16IdToken(
        messageContext,
        faker.string.uuid(),
      );

      expect(response.idTagInfo.status).toBe(OCPP1_6.StartTransactionResponseStatus.ConcurrentTx);
      expect(response.idTagInfo.parentIdTag).toBeUndefined();
      expect(response.idTagInfo.expiryDate).toBeUndefined();
    });
  });
});
