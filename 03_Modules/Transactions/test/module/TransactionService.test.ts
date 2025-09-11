// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  IAuthorizationRepository,
  IOCPPMessageRepository,
  IReservationRepository,
  ITransactionEventRepository,
} from '@citrineos/data';
import {
  AuthorizationStatusType,
  DEFAULT_TENANT_ID,
  IAuthorizer,
  OCPP1_6,
  OCPP2_0_1,
} from '@citrineos/base';
import { TransactionService } from '../../src/module/TransactionService';
import { anIdToken } from '../providers/IdTokenProvider';
import { anAuthorization } from '../providers/AuthorizationProvider';

import { aMessageContext } from '../providers/MessageContextProvider';
import { aTransaction, aTransactionEventRequest } from '../providers/TransactionProvider';
import { faker } from '@faker-js/faker';

describe('TransactionService', () => {
  let transactionService: TransactionService;
  let authorizationRepository: jest.Mocked<IAuthorizationRepository>;
  let transactionEventRepository: jest.Mocked<ITransactionEventRepository>;
  let reservationRepository: jest.Mocked<IReservationRepository>;
  let ocppMessageRepository: jest.Mocked<IOCPPMessageRepository>;
  let authorizer: jest.Mocked<IAuthorizer>;
  let realTimeAuthorizer: jest.Mocked<IAuthorizer>;

  beforeEach(() => {
    authorizationRepository = {
      readAllByQuerystring: jest.fn(),
      readOnlyOneByQuery: jest.fn().mockResolvedValue({ idToken: 1 }),
    } as unknown as jest.Mocked<IAuthorizationRepository>;

    transactionEventRepository = {
      readAllActiveTransactionsIncludeTransactionEventByIdToken: jest.fn(),
      readAllActiveTransactionsIncludeStartTransactionByIdToken: jest.fn(),
    } as unknown as jest.Mocked<ITransactionEventRepository>;

    reservationRepository = {} as unknown as jest.Mocked<IReservationRepository>;

    ocppMessageRepository = {} as unknown as jest.Mocked<IOCPPMessageRepository>;

    authorizer = {
      authorize: jest.fn(),
    } as jest.Mocked<IAuthorizer>;

    realTimeAuthorizer = {
      authorize: jest.fn(),
    } as jest.Mocked<IAuthorizer>;

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
    const response = await transactionService.authorizeIdToken(
      DEFAULT_TENANT_ID,
      transactionEventRequest,
      messageContext,
    );

    expect(response.idTokenInfo!.status).toBe(OCPP2_0_1.AuthorizationStatusEnumType.Unknown);
  });

  it('should return Accepted status when idTokenInfo is not defined', async () => {
    const authorization = anAuthorization((auth) => {
      // idTokenInfo is now flat, so set status directly
      auth.status = undefined as any; // purposely set to undefined for test, but TS will error, so use 'as any'
    });
    authorizationRepository.readAllByQuerystring.mockResolvedValue([authorization]);

    const transactionEventRequest = aTransactionEventRequest((item) => {
      item.idToken = {
        idToken: faker.string.uuid(),
        type: OCPP2_0_1.IdTokenEnumType.Central,
      };
    });
    const messageContext = aMessageContext();
    const response = await transactionService.authorizeIdToken(
      DEFAULT_TENANT_ID,
      transactionEventRequest,
      messageContext,
    );

    expect(response.idTokenInfo?.status).toBe(OCPP2_0_1.AuthorizationStatusEnumType.Accepted);
  });

  it('should return status from idTokenInfo when not Accepted', async () => {
    const authorization = anAuthorization((auth) => {
      auth.status = AuthorizationStatusType.Blocked;
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
    const response = await transactionService.authorizeIdToken(
      DEFAULT_TENANT_ID,
      transactionEventRequest,
      messageContext,
    );

    expect(response.idTokenInfo?.status).toBe(OCPP2_0_1.AuthorizationStatusEnumType.Blocked);
  });

  it('should return Invalid status when cacheExpiryDateTime is expired', async () => {
    const expiredDate = new Date(Date.now() - 1000).toISOString();
    const authorization = anAuthorization((auth) => {
      auth.status = AuthorizationStatusType.Accepted;
      auth.cacheExpiryDateTime = expiredDate;
    });
    authorizationRepository.readAllByQuerystring.mockResolvedValue([authorization]);

    const transactionEventRequest = aTransactionEventRequest((item) => {
      item.idToken = anIdToken();
      item.eventType = OCPP2_0_1.TransactionEventEnumType.Started;
    });
    const messageContext = aMessageContext();
    const response = await transactionService.authorizeIdToken(
      DEFAULT_TENANT_ID,
      transactionEventRequest,
      messageContext,
    );

    expect(response.idTokenInfo?.status).toBe(OCPP2_0_1.AuthorizationStatusEnumType.Invalid);
  });

  it('should not return ConcurrentTx status when there are concurrent transactions and concurrentTx is false', async () => {
    const authorization = anAuthorization((auth) => {
      auth.status = AuthorizationStatusType.Accepted;
    });
    authorizationRepository.readAllByQuerystring.mockResolvedValue([authorization]);
    transactionEventRepository.readAllActiveTransactionsIncludeTransactionEventByIdToken.mockResolvedValue(
      [aTransaction(), aTransaction()],
    );
    authorizer.authorize.mockResolvedValue(AuthorizationStatusType.Accepted);
    realTimeAuthorizer.authorize.mockResolvedValue(AuthorizationStatusType.Accepted);

    const transactionEventRequest = aTransactionEventRequest((item) => {
      item.idToken = anIdToken();
      item.eventType = OCPP2_0_1.TransactionEventEnumType.Started;
    });
    const messageContext = aMessageContext();
    const response = await transactionService.authorizeIdToken(
      DEFAULT_TENANT_ID,
      transactionEventRequest,
      messageContext,
    );

    expect(response.idTokenInfo?.status).toBe(OCPP2_0_1.AuthorizationStatusEnumType.Accepted);
  });

  it('should return ConcurrentTx status when there are concurrent transactions and concurrentTx is true', async () => {
    const authorization = anAuthorization((auth) => {
      auth.concurrentTransaction = true;
      auth.status = AuthorizationStatusType.Accepted;
    });
    authorizationRepository.readAllByQuerystring.mockResolvedValue([authorization]);
    transactionEventRepository.readAllActiveTransactionsIncludeTransactionEventByIdToken.mockResolvedValue(
      [aTransaction(), aTransaction()],
    );
    authorizer.authorize.mockResolvedValue(AuthorizationStatusType.Accepted);
    realTimeAuthorizer.authorize.mockResolvedValue(AuthorizationStatusType.Accepted);

    const transactionEventRequest = aTransactionEventRequest((item) => {
      item.idToken = anIdToken();
      item.eventType = OCPP2_0_1.TransactionEventEnumType.Started;
    });
    const messageContext = aMessageContext();
    const response = await transactionService.authorizeIdToken(
      DEFAULT_TENANT_ID,
      transactionEventRequest,
      messageContext,
    );

    expect(response.idTokenInfo?.status).toBe(OCPP2_0_1.AuthorizationStatusEnumType.ConcurrentTx);
  });

  it('should apply authorizers when status is Accepted and transaction is started', async () => {
    const authorization = anAuthorization((auth) => {
      auth.status = AuthorizationStatusType.Accepted;
    });
    authorizationRepository.readAllByQuerystring.mockResolvedValue([authorization]);
    transactionEventRepository.readAllActiveTransactionsIncludeTransactionEventByIdToken.mockResolvedValue(
      [],
    );
    authorizer.authorize.mockResolvedValue(AuthorizationStatusType.Accepted);
    realTimeAuthorizer.authorize.mockResolvedValue(AuthorizationStatusType.Accepted);

    const transactionEventRequest = aTransactionEventRequest((item) => {
      item.idToken = anIdToken();
      item.eventType = OCPP2_0_1.TransactionEventEnumType.Started;
    });
    const messageContext = aMessageContext();
    const response = await transactionService.authorizeIdToken(
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
      transactionEventRepository.readAllActiveTransactionsIncludeStartTransactionByIdToken.mockResolvedValue(
        [],
      );
      authorizer.authorize.mockResolvedValue(AuthorizationStatusType.Accepted);
      realTimeAuthorizer.authorize.mockResolvedValue(AuthorizationStatusType.Accepted);

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
        auth.status = AuthorizationStatusType.Blocked;
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
      transactionEventRepository.readAllActiveTransactionsIncludeStartTransactionByIdToken.mockResolvedValue(
        [aTransaction()],
      );

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
