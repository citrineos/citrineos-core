// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_TENANT_ID, type IAuthorizer } from '@citrineos/base';
import {
  type IAuthorizationRepository,
  type ILocationRepository,
  type IOCPPMessageRepository,
  type IReservationRepository,
  type ITransactionEventRepository,
} from '@citrineos/core';
import {
  AuthorizationStatusEnum,
  type AuthorizationStatusEnumType,
  OCPP1_6,
  OCPP2_0_1,
  OCPP2_1,
} from '@citrineos/types';
import { TransactionService } from '@modules/Transactions/src/module/TransactionService.js';
import { anAuthorization } from '../providers/AuthorizationProvider.js';
import { anIdToken } from '../providers/IdTokenProvider.js';

import { faker } from '@faker-js/faker';
import { createTestContainer, getTestInstance } from '@test/testContainer.js';
import { beforeEach, describe, expect, it, type Mocked, vi } from 'vitest';
import { aMessageContext } from '../providers/MessageContextProvider.js';
import { aTransaction, aTransactionEventRequest } from '../providers/TransactionProvider.js';

describe('TransactionService', () => {
  // idToken of the group Authorization that groupAuthorizationId points at.
  const PARENT_ID_TAG = 'parent-id-tag';

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
      readOnlyOneByQuerystring: vi.fn().mockResolvedValue({ idToken: PARENT_ID_TAG }),
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

  // C02.FR.02: "CSMS receives a TransactionEventRequest with an IdTokenType of type:
  // NoAuthorization -> The CSMS SHALL respond with a TransactionEventResponse with
  // IdTokenInfo.status set Accepted." C02.FR.01 has the station send this when a transaction is
  // started with a button, so there is no Authorization row to find and none is expected.
  describe('C02 - transaction started with a button', () => {
    const noAuthorizationIdToken = anIdToken((token) => {
      token.idToken = '';
      token.type = OCPP2_0_1.IdTokenEnumType.NoAuthorization;
    });

    it('accepts a NoAuthorization idToken on OCPP 2.0.1', async () => {
      authorizationRepository.readAllByQuerystring.mockResolvedValue([]);
      const transactionEventRequest = aTransactionEventRequest((item) => {
        item.idToken = noAuthorizationIdToken;
      });

      const response = await transactionService.authorizeOcpp201IdToken(
        DEFAULT_TENANT_ID,
        transactionEventRequest,
        aMessageContext(),
      );

      expect(response.idTokenInfo!.status).toBe(OCPP2_0_1.AuthorizationStatusEnumType.Accepted);
    });

    it('accepts a NoAuthorization idToken on OCPP 2.1', async () => {
      authorizationRepository.readAllByQuerystring.mockResolvedValue([]);
      const transactionEventRequest = aTransactionEventRequest((item) => {
        item.idToken = noAuthorizationIdToken;
      });

      const response = await transactionService.authorizeOcpp21IdToken(
        DEFAULT_TENANT_ID,
        transactionEventRequest,
        aMessageContext(),
      );

      expect(response.idTokenInfo!.status).toBe(OCPP2_1.AuthorizationStatusEnumType.Accepted);
    });

    it('does not look the token up at all', async () => {
      authorizationRepository.readAllByQuerystring.mockResolvedValue([]);
      const transactionEventRequest = aTransactionEventRequest((item) => {
        item.idToken = noAuthorizationIdToken;
      });

      await transactionService.authorizeOcpp201IdToken(
        DEFAULT_TENANT_ID,
        transactionEventRequest,
        aMessageContext(),
      );

      expect(authorizationRepository.readAllByQuerystring).not.toHaveBeenCalled();
    });
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
      auth.concurrentTransaction = false;
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
      expect(response.idTagInfo.parentIdTag).toBe(PARENT_ID_TAG);
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

    it('should not accept an authorization that has no status', async () => {
      const authorization = anAuthorization((auth) => {
        auth.status = undefined as unknown as AuthorizationStatusEnumType;
      });
      authorizationRepository.readAllByQuerystring.mockResolvedValue([authorization]);
      transactionEventRepository.readAllActiveTransactionsByAuthorizationId.mockResolvedValue([]);
      authorizer.authorize.mockResolvedValue(AuthorizationStatusEnum.Accepted);
      realTimeAuthorizer.authorize.mockResolvedValue(AuthorizationStatusEnum.Accepted);

      const messageContext = aMessageContext();
      const connectorId = 1;
      const response = await transactionService.authorizeOcpp16IdToken(
        messageContext,
        faker.string.uuid(),
        connectorId,
      );

      expect(response.idTagInfo.status).toBe(OCPP1_6.StartTransactionResponseStatus.Invalid);
    });

    it('should not consult the authorizers for an authorization that has no status', async () => {
      const authorization = anAuthorization((auth) => {
        auth.status = undefined as unknown as AuthorizationStatusEnumType;
      });
      authorizationRepository.readAllByQuerystring.mockResolvedValue([authorization]);
      transactionEventRepository.readAllActiveTransactionsByAuthorizationId.mockResolvedValue([]);
      // A permissive real-time authorizer must not be able to rescue a statusless token, and the
      // rejection has to happen before we spend a network round trip asking it.
      realTimeAuthorizer.authorize.mockResolvedValue(AuthorizationStatusEnum.Accepted);

      const messageContext = aMessageContext();
      const connectorId = 1;
      const response = await transactionService.authorizeOcpp16IdToken(
        messageContext,
        faker.string.uuid(),
        connectorId,
      );

      expect(response.idTagInfo.status).toBe(OCPP1_6.StartTransactionResponseStatus.Invalid);
      expect(realTimeAuthorizer.authorize).not.toHaveBeenCalled();
    });

    it('should return ConcurrentTx status when an active transaction exists', async () => {
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

    it('should allow concurrent transactions when concurrentTransaction is true', async () => {
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
        faker.string.uuid(),
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

      transactionService = getTestInstance(container, TransactionService, {
        transactionEventRepository,
        authorizationRepository: {} as unknown as IAuthorizationRepository,
        locationRepository,
        reservationRepository: {} as unknown as IReservationRepository,
        ocppMessageRepository: {} as unknown as IOCPPMessageRepository,
        realTimeAuthorizer,
        authorizers: [],
      });
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
