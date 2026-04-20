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
  ILocationRepository,
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
  let locationRepository: Mocked<ILocationRepository>;
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

    locationRepository = {
      readConnectorByStationIdAndOcpp16ConnectorId: vi.fn(),
      readConnectorByStationIdAndOcpp201EvseType: vi.fn(),
    } as unknown as Mocked<ILocationRepository>;

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
      locationRepository,
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

  it('should return ConcurrentTx status when there are concurrent transactions and concurrentTx is false', async () => {
    const authorization = anAuthorization((auth) => {
      auth.status = AuthorizationStatusEnum.Accepted;
    });
    authorizationRepository.readAllByQuerystring.mockResolvedValue([authorization]);
    transactionEventRepository.readAllActiveTransactionsByAuthorizationId.mockResolvedValue([
      aTransaction(),
      aTransaction(),
    ]);

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

  it('should not return ConcurrentTx status when there are concurrent transactions and concurrentTx is true', async () => {
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

    expect(response.idTokenInfo?.status).toBe(OCPP2_0_1.AuthorizationStatusEnumType.Accepted);
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
      const connectorId = 1;
      const response = await transactionService.authorizeOcpp16IdToken(
        messageContext,
        authorization.idToken,
        connectorId,
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
      const connectorId = 1;
      const response = await transactionService.authorizeOcpp16IdToken(
        messageContext,
        faker.string.uuid(),
        connectorId,
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
      const connectorId = 1;
      const response = await transactionService.authorizeOcpp16IdToken(
        messageContext,
        faker.string.uuid(),
        connectorId,
      );

      expect(response.idTagInfo.status).toBe(OCPP1_6.StartTransactionResponseStatus.Expired);
      expect(response.idTagInfo.parentIdTag).toBeUndefined();
      expect(response.idTagInfo.expiryDate).toBeUndefined();
    });

    it('should return ConcurrentTx status when an active transaction exists and concurrentTx is not enabled', async () => {
      const authorization = anAuthorization();
      authorizationRepository.readAllByQuerystring.mockResolvedValue([authorization]);
      transactionEventRepository.readAllActiveTransactionsByAuthorizationId.mockResolvedValue([
        aTransaction(),
      ]);

      const messageContext = aMessageContext();
      const connectorId = 1;
      const response = await transactionService.authorizeOcpp16IdToken(
        messageContext,
        faker.string.uuid(),
        connectorId,
      );

      expect(response.idTagInfo.status).toBe(OCPP1_6.StartTransactionResponseStatus.ConcurrentTx);
      expect(response.idTagInfo.parentIdTag).toBeUndefined();
      expect(response.idTagInfo.expiryDate).toBeUndefined();
    });

    it('should allow concurrent transactions when concurrentTx is true', async () => {
      const authorization = anAuthorization((auth) => {
        auth.concurrentTransaction = true;
      });
      authorizationRepository.readAllByQuerystring.mockResolvedValue([authorization]);
      transactionEventRepository.readAllActiveTransactionsByAuthorizationId.mockResolvedValue([
        aTransaction(),
      ]);
      authorizer.authorize.mockResolvedValue(AuthorizationStatusEnum.Accepted);
      realTimeAuthorizer.authorize.mockResolvedValue(AuthorizationStatusEnum.Accepted);

      const messageContext = aMessageContext();
      const connectorId = 1;
      const response = await transactionService.authorizeOcpp16IdToken(
        messageContext,
        authorization.idToken,
        connectorId,
      );

      expect(response.idTagInfo.status).toBe(OCPP1_6.StartTransactionResponseStatus.Accepted);
    });
  });

  describe('TransactionService.deactivateOtherActiveTransactionsAtEvse', () => {
    let transactionService: TransactionService;
    let transactionEventRepository: Mocked<ITransactionEventRepository>;
    let locationRepository: Mocked<ILocationRepository>;
    let realTimeAuthorizer: Mocked<IAuthorizer>;

    const STATION_ID = 'station-001';
    const TRANSACTION_ID = 'txn-new-001';

    beforeEach(() => {
      transactionEventRepository = {
        readAllActiveTransactionsByAuthorizationId: vi.fn(),
        deactivateActiveTransactionsByStationIdAndEvseId: vi
          .fn()
          .mockResolvedValue([{ id: 1, transactionId: 'txn-old', isActive: false }]),
      } as unknown as Mocked<ITransactionEventRepository>;

      locationRepository = {
        readConnectorByStationIdAndOcpp16ConnectorId: vi.fn(),
        readConnectorByStationIdAndOcpp201EvseType: vi.fn(),
      } as unknown as Mocked<ILocationRepository>;

      realTimeAuthorizer = {
        authorize: vi.fn(),
      } as Mocked<IAuthorizer>;

      transactionService = new TransactionService(
        transactionEventRepository,
        {} as unknown as IAuthorizationRepository,
        locationRepository,
        {} as unknown as IReservationRepository,
        {} as unknown as IOCPPMessageRepository,
        realTimeAuthorizer,
      );
    });

    describe('OCPP 2.0.1 — EVSEType identifier', () => {
      it('calls deactivateActiveTransactionsByStationIdAndEvseId with evse.id directly', async () => {
        const evseId = faker.number.int({ min: 1, max: 10 });
        const evseIdentifier: OCPP2_0_1.EVSEType = { id: evseId };

        await transactionService.deactivateOtherActiveTransactionsAtEvse(
          DEFAULT_TENANT_ID,
          TRANSACTION_ID,
          STATION_ID,
          evseIdentifier,
        );

        expect(
          transactionEventRepository.deactivateActiveTransactionsByStationIdAndEvseId,
        ).toHaveBeenCalledOnce();
        expect(
          transactionEventRepository.deactivateActiveTransactionsByStationIdAndEvseId,
        ).toHaveBeenCalledWith(DEFAULT_TENANT_ID, STATION_ID, evseId, TRANSACTION_ID);
      });

      it('skips deactivation and does not call the repository when evse.id is undefined', async () => {
        const evseIdentifier = { id: undefined } as unknown as OCPP2_0_1.EVSEType;

        await transactionService.deactivateOtherActiveTransactionsAtEvse(
          DEFAULT_TENANT_ID,
          TRANSACTION_ID,
          STATION_ID,
          evseIdentifier,
        );

        expect(
          transactionEventRepository.deactivateActiveTransactionsByStationIdAndEvseId,
        ).not.toHaveBeenCalled();
      });
    });

    describe('OCPP 1.6 — numeric connector ID', () => {
      it('resolves evseTypeId via connector lookup and calls deactivateActiveTransactionsByStationIdAndEvseId', async () => {
        const connectorId = 2;
        const evseTypeId = 5;
        locationRepository.readConnectorByStationIdAndOcpp16ConnectorId.mockResolvedValue({
          id: 10,
          evse: { evseTypeId },
        } as any);

        await transactionService.deactivateOtherActiveTransactionsAtEvse(
          DEFAULT_TENANT_ID,
          TRANSACTION_ID,
          STATION_ID,
          connectorId,
        );

        expect(
          locationRepository.readConnectorByStationIdAndOcpp16ConnectorId,
        ).toHaveBeenCalledWith(DEFAULT_TENANT_ID, STATION_ID, connectorId);
        expect(
          transactionEventRepository.deactivateActiveTransactionsByStationIdAndEvseId,
        ).toHaveBeenCalledOnce();
        expect(
          transactionEventRepository.deactivateActiveTransactionsByStationIdAndEvseId,
        ).toHaveBeenCalledWith(DEFAULT_TENANT_ID, STATION_ID, evseTypeId, TRANSACTION_ID);
      });

      it('logs a warning and skips deactivation when connector is not found', async () => {
        locationRepository.readConnectorByStationIdAndOcpp16ConnectorId.mockResolvedValue(
          undefined,
        );

        await transactionService.deactivateOtherActiveTransactionsAtEvse(
          DEFAULT_TENANT_ID,
          TRANSACTION_ID,
          STATION_ID,
          3, // connectorId
        );

        expect(
          transactionEventRepository.deactivateActiveTransactionsByStationIdAndEvseId,
        ).not.toHaveBeenCalled();
      });

      it('logs a warning and skips deactivation when connector has no evse.evseTypeId', async () => {
        locationRepository.readConnectorByStationIdAndOcpp16ConnectorId.mockResolvedValue({
          id: 10,
          evse: undefined,
        } as any);

        await transactionService.deactivateOtherActiveTransactionsAtEvse(
          DEFAULT_TENANT_ID,
          TRANSACTION_ID,
          STATION_ID,
          4,
        );

        expect(
          transactionEventRepository.deactivateActiveTransactionsByStationIdAndEvseId,
        ).not.toHaveBeenCalled();
      });
    });
  });
});
