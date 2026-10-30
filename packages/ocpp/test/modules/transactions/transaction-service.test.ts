// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_TENANT_ID, type IAuthorizer } from '@citrineos/base';
import {
  type IAuthorizationRepository,
  type IConnectorRepository,
  type IEvseRepository,
  type IMeterValueRepository,
  type IReservationRepository,
  type ITransactionRepository,
} from '@citrineos/dal';
import { TransactionService } from '@modules/transactions/transaction-service.js';
import {
  type AuthorizationDecision,
  newAuthorizationDecision,
} from '@services/authorization-attempts/index.js';
import { anAuthorization } from './providers/authorization-provider.js';
import { anIdToken } from './providers/id-token-provider.js';

import {
  AuthorizationAttemptReasonEnum,
  AuthorizationStatusEnum,
  type AuthorizationStatusEnumType,
  type ConnectorDto,
  type EvseDto,
  type MeterValueDto,
  OCPP1_6,
  OCPP2_0_1,
  OCPP2_1,
  type TransactionDto,
} from '@citrineos/types';
import { faker } from '@faker-js/faker';
import { createTestContainer, getTestInstance } from '@test/test-container.js';
import { beforeEach, describe, expect, it, type Mocked, vi } from 'vitest';
import { aMessageContext } from './providers/message-context-provider.js';
import { aTransaction, aTransactionEventRequest } from './providers/transaction-provider.js';

describe('TransactionService', () => {
  // idToken of the group Authorization that groupAuthorizationId points at.
  const PARENT_ID_TAG = 'parent-id-tag';

  const { container } = createTestContainer();
  let transactionService: TransactionService;
  let authorizationRepository: Mocked<IAuthorizationRepository>;
  let transactionRepositoryMock: Mocked<IMeterValueRepository & ITransactionRepository>;
  let locationRepository: Mocked<IConnectorRepository & IEvseRepository>;
  let reservationRepository: Mocked<IReservationRepository>;
  let authorizer: Mocked<IAuthorizer>;
  let realTimeAuthorizer: Mocked<IAuthorizer>;

  beforeEach(() => {
    authorizationRepository = {
      readAllByQuerystring: vi.fn(),
      readOnlyOneByQuerystring: vi.fn().mockResolvedValue({ idToken: PARENT_ID_TAG }),
    } as unknown as Mocked<IAuthorizationRepository>;

    transactionRepositoryMock = {
      readAllActiveTransactionsByAuthorizationId: vi.fn(),
      updateTransactionByStationIdAndTransactionId: vi.fn(),
    } as unknown as Mocked<IMeterValueRepository & ITransactionRepository>;

    locationRepository = {
      readConnectorByStationIdAndOcpp16ConnectorId: vi.fn(),
      readConnectorByStationIdAndOcpp201EvseType: vi.fn(),
    } as unknown as Mocked<IConnectorRepository & IEvseRepository>;

    reservationRepository = {} as unknown as Mocked<IReservationRepository>;

    authorizer = {
      authorize: vi.fn(),
    } as Mocked<IAuthorizer>;

    realTimeAuthorizer = {
      authorize: vi.fn(),
    } as Mocked<IAuthorizer>;

    transactionService = getTestInstance(container, TransactionService, {
      meterValueRepository: transactionRepositoryMock,
      transactionRepository: transactionRepositoryMock,
      authorizationRepository,
      evseRepository: locationRepository,
      connectorRepository: locationRepository,
      reservationRepository,
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
    transactionRepositoryMock.readAllActiveTransactionsByAuthorizationId.mockResolvedValue([
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
    transactionRepositoryMock.readAllActiveTransactionsByAuthorizationId.mockResolvedValue([
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
    transactionRepositoryMock.readAllActiveTransactionsByAuthorizationId.mockResolvedValue([]);
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
      transactionRepositoryMock.readAllActiveTransactionsByAuthorizationId.mockResolvedValue([]);
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
      transactionRepositoryMock.readAllActiveTransactionsByAuthorizationId.mockResolvedValue([]);
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
      transactionRepositoryMock.readAllActiveTransactionsByAuthorizationId.mockResolvedValue([]);
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
      transactionRepositoryMock.readAllActiveTransactionsByAuthorizationId.mockResolvedValue([
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
      transactionRepositoryMock.readAllActiveTransactionsByAuthorizationId.mockResolvedValue([
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
    let transactionRepositoryMock: Mocked<IMeterValueRepository & ITransactionRepository>;
    let locationRepository: Mocked<IConnectorRepository & IEvseRepository>;
    let realTimeAuthorizer: Mocked<IAuthorizer>;

    const STATION_ID = 'station-001';
    const TRANSACTION_ID = 'txn-new-001';

    beforeEach(() => {
      transactionRepositoryMock = {
        readAllActiveTransactionsByAuthorizationId: vi.fn(),
        deactivateActiveTransactionsByStationIdAndEvseId: vi
          .fn()
          .mockResolvedValue([{ id: 1, transactionId: 'txn-old', isActive: false }]),
      } as unknown as Mocked<IMeterValueRepository & ITransactionRepository>;

      locationRepository = {
        readConnectorByStationIdAndOcpp16ConnectorId: vi.fn(),
        readConnectorByStationIdAndOcpp201EvseType: vi.fn(),
        readEvseByStationIdAndOcpp201EvseId: vi.fn(),
      } as unknown as Mocked<IConnectorRepository & IEvseRepository>;

      realTimeAuthorizer = {
        authorize: vi.fn(),
      } as Mocked<IAuthorizer>;

      transactionService = getTestInstance(container, TransactionService, {
        meterValueRepository: transactionRepositoryMock,
        transactionRepository: transactionRepositoryMock,
        authorizationRepository: {} as unknown as IAuthorizationRepository,
        evseRepository: locationRepository,
        connectorRepository: locationRepository,
        reservationRepository: {} as unknown as IReservationRepository,
        realTimeAuthorizer,
        authorizers: [],
      });
    });

    describe('OCPP 2.0.1 — EVSEType identifier', () => {
      it('resolves the Evse row and calls deactivateActiveTransactionsByStationIdAndEvseId with its id', async () => {
        const evseTypeId = faker.number.int({ min: 1, max: 10 });
        const evse: EvseDto = { id: 42, stationId: 1, evseTypeId };
        locationRepository.readEvseByStationIdAndOcpp201EvseId.mockResolvedValue(evse);

        await transactionService.deactivateOtherActiveTransactionsAtEvse(
          DEFAULT_TENANT_ID,
          TRANSACTION_ID,
          STATION_ID,
          { id: evseTypeId },
        );

        expect(locationRepository.readEvseByStationIdAndOcpp201EvseId).toHaveBeenCalledWith(
          DEFAULT_TENANT_ID,
          STATION_ID,
          evseTypeId,
        );
        expect(
          transactionRepositoryMock.deactivateActiveTransactionsByStationIdAndEvseId,
        ).toHaveBeenCalledOnce();
        expect(
          transactionRepositoryMock.deactivateActiveTransactionsByStationIdAndEvseId,
        ).toHaveBeenCalledWith(DEFAULT_TENANT_ID, STATION_ID, evse.id, TRANSACTION_ID);
      });

      it('skips deactivation when no Evse row exists for the evse.id', async () => {
        locationRepository.readEvseByStationIdAndOcpp201EvseId.mockResolvedValue(undefined);

        await transactionService.deactivateOtherActiveTransactionsAtEvse(
          DEFAULT_TENANT_ID,
          TRANSACTION_ID,
          STATION_ID,
          { id: 3 },
        );

        expect(
          transactionRepositoryMock.deactivateActiveTransactionsByStationIdAndEvseId,
        ).not.toHaveBeenCalled();
      });
    });

    describe('OCPP 1.6 — numeric connector ID', () => {
      it('resolves the connector and calls deactivateActiveTransactionsByStationIdAndEvseId with its evseId', async () => {
        const connectorId = 2;
        const connector: ConnectorDto = {
          id: 10,
          stationId: 1,
          evseId: 5,
          evse: { evseTypeId: 5 },
        };
        locationRepository.readConnectorByStationIdAndOcpp16ConnectorId.mockResolvedValue(
          connector,
        );

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
          transactionRepositoryMock.deactivateActiveTransactionsByStationIdAndEvseId,
        ).toHaveBeenCalledOnce();
        expect(
          transactionRepositoryMock.deactivateActiveTransactionsByStationIdAndEvseId,
        ).toHaveBeenCalledWith(DEFAULT_TENANT_ID, STATION_ID, connector.evseId, TRANSACTION_ID);
      });

      it('uses the connector evseId when the auto-commissioned evse has a null evseTypeId', async () => {
        const connector: ConnectorDto = {
          id: 11,
          stationId: 1,
          evseId: 77,
          evse: { id: 77, evseTypeId: null },
        };
        locationRepository.readConnectorByStationIdAndOcpp16ConnectorId.mockResolvedValue(
          connector,
        );

        await transactionService.deactivateOtherActiveTransactionsAtEvse(
          DEFAULT_TENANT_ID,
          TRANSACTION_ID,
          STATION_ID,
          2,
        );

        expect(
          transactionRepositoryMock.deactivateActiveTransactionsByStationIdAndEvseId,
        ).toHaveBeenCalledWith(DEFAULT_TENANT_ID, STATION_ID, 77, TRANSACTION_ID);
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
          transactionRepositoryMock.deactivateActiveTransactionsByStationIdAndEvseId,
        ).not.toHaveBeenCalled();
      });
    });
  });

  describe('updateTransactionStatus', () => {
    it('sets isActive on the transaction named in the GetTransactionStatusRequest', async () => {
      transactionRepositoryMock.updateTransactionByStationIdAndTransactionId = vi
        .fn()
        .mockResolvedValue(aTransaction());

      await transactionService.updateTransactionStatus(
        DEFAULT_TENANT_ID,
        'cs-001',
        { transactionId: 'tx-1' },
        false,
      );

      expect(
        transactionRepositoryMock.updateTransactionByStationIdAndTransactionId,
      ).toHaveBeenCalledWith(DEFAULT_TENANT_ID, { isActive: false }, 'tx-1', 'cs-001');
    });

    it('updates nothing without the GetTransactionStatusRequest', async () => {
      transactionRepositoryMock.updateTransactionByStationIdAndTransactionId = vi.fn();

      await transactionService.updateTransactionStatus(
        DEFAULT_TENANT_ID,
        'cs-001',
        undefined,
        false,
      );

      expect(
        transactionRepositoryMock.updateTransactionByStationIdAndTransactionId,
      ).not.toHaveBeenCalled();
    });
  });
  describe('TransactionService.recalculateTotalKwh', () => {
    const STATION = 'cp001';

    // Two register readings two minutes apart: 1 kWh then 5 kWh, so the energy drawn
    // during this batch is unambiguous and differs from either reading.
    const registerReadings = (): MeterValueDto[] => [
      {
        timestamp: '2026-10-09T15:52:48.000Z',
        sampledValue: [
          {
            value: 1000,
            context: OCPP2_0_1.ReadingContextEnumType.Sample_Periodic,
            measurand: OCPP2_0_1.MeasurandEnumType.Energy_Active_Import_Register,
            unitOfMeasure: { unit: 'Wh', multiplier: 0 },
          },
        ],
      },
      {
        timestamp: '2026-10-09T15:54:48.000Z',
        sampledValue: [
          {
            value: 5000,
            context: OCPP2_0_1.ReadingContextEnumType.Sample_Periodic,
            measurand: OCPP2_0_1.MeasurandEnumType.Energy_Active_Import_Register,
            unitOfMeasure: { unit: 'Wh', multiplier: 0 },
          },
        ],
      },
    ];

    const aPersistedTransaction = (overrides: Partial<TransactionDto> = {}): TransactionDto =>
      ({
        id: 7,
        transactionId: 'T-7',
        isActive: true,
        totalKwh: null,
        meterStart: null,
        ...overrides,
      }) as TransactionDto;

    it('seeds meterStart from the readings when the transaction has none', async () => {
      const transaction = aPersistedTransaction();

      const totalKwh = await transactionService.recalculateTotalKwh(
        DEFAULT_TENANT_ID,
        STATION,
        transaction,
        registerReadings(),
      );

      // Earliest reading is the baseline, so the energy drawn is 5 - 1.
      expect(totalKwh).toBe(4);
      expect(
        transactionRepositoryMock.updateTransactionByStationIdAndTransactionId,
      ).toHaveBeenCalledWith(DEFAULT_TENANT_ID, { meterStart: 1, totalKwh: 4 }, 'T-7', STATION);
    });

    it('keeps the meterStart already on the transaction and prices against it', async () => {
      const transaction = aPersistedTransaction({ meterStart: 2 });

      const totalKwh = await transactionService.recalculateTotalKwh(
        DEFAULT_TENANT_ID,
        STATION,
        transaction,
        registerReadings(),
      );

      // 5 - 2, not 5 - 1: a meterStart already recorded is never recomputed.
      expect(totalKwh).toBe(3);
      expect(
        transactionRepositoryMock.updateTransactionByStationIdAndTransactionId,
      ).toHaveBeenCalledWith(DEFAULT_TENANT_ID, { totalKwh: 3 }, 'T-7', STATION);
    });

    // The caller hands the same object to cost calculation immediately afterwards, and
    // CostCalculator prices on transaction.totalKwh. Writing only the row would price the
    // session on the previous reading.
    it('refreshes totalKwh on the passed transaction, not just the row', async () => {
      const transaction = aPersistedTransaction({ totalKwh: 2, meterStart: 1 });

      await transactionService.recalculateTotalKwh(
        DEFAULT_TENANT_ID,
        STATION,
        transaction,
        registerReadings(),
      );

      expect(transaction.totalKwh).toBe(4);
    });

    it('refreshes a seeded meterStart on the passed transaction too', async () => {
      const transaction = aPersistedTransaction();

      await transactionService.recalculateTotalKwh(
        DEFAULT_TENANT_ID,
        STATION,
        transaction,
        registerReadings(),
      );

      expect(transaction.meterStart).toBe(1);
    });

    it('addresses the row by transactionId and station, not by database id', async () => {
      const transaction = aPersistedTransaction({ id: 99, transactionId: 'T-99' });

      await transactionService.recalculateTotalKwh(
        DEFAULT_TENANT_ID,
        STATION,
        transaction,
        registerReadings(),
      );

      const [, , transactionId, ocppConnectionName] =
        transactionRepositoryMock.updateTransactionByStationIdAndTransactionId.mock.calls[0];
      expect(transactionId).toBe('T-99');
      expect(ocppConnectionName).toBe(STATION);
    });
  });

  describe('authorization decision reasons', () => {
    function startedEvent() {
      return aTransactionEventRequest((item) => {
        item.idToken = anIdToken();
        item.eventType = OCPP2_0_1.TransactionEventEnumType.Started;
      });
    }

    async function decide201(): Promise<AuthorizationDecision> {
      const decision = newAuthorizationDecision();
      await transactionService.authorizeOcpp201IdToken(
        DEFAULT_TENANT_ID,
        startedEvent(),
        aMessageContext(),
        decision,
      );
      return decision;
    }

    async function decide16(): Promise<AuthorizationDecision> {
      const decision = newAuthorizationDecision();
      await transactionService.authorizeOcpp16IdToken(aMessageContext(), 'TAG-1', 1, decision);
      return decision;
    }

    beforeEach(() => {
      transactionRepositoryMock.readAllActiveTransactionsByAuthorizationId.mockResolvedValue([]);
      authorizer.authorize.mockResolvedValue(AuthorizationStatusEnum.Accepted);
      realTimeAuthorizer.authorize.mockResolvedValue(AuthorizationStatusEnum.Accepted);
    });

    it.each([
      ['no Authorization', 0, AuthorizationAttemptReasonEnum.NotFound],
      ['more than one Authorization', 2, AuthorizationAttemptReasonEnum.MultipleFound],
    ])('explains an Unknown/Invalid answer for %s', async (_label, matches, reason) => {
      authorizationRepository.readAllByQuerystring.mockResolvedValue(
        Array.from({ length: matches }, () => anAuthorization()),
      );

      expect((await decide201()).reason).toBe(reason);
      expect((await decide16()).reason).toBe(reason);
    });

    it('blames the stored status, and keeps the Authorization it read', async () => {
      const authorization = anAuthorization((auth) => {
        auth.status = AuthorizationStatusEnum.Blocked;
      });
      authorizationRepository.readAllByQuerystring.mockResolvedValue([authorization]);

      expect(await decide201()).toEqual({
        reason: AuthorizationAttemptReasonEnum.StoredStatus,
        authorization,
      });
      expect((await decide16()).reason).toBe(AuthorizationAttemptReasonEnum.StoredStatus);
    });

    it('blames an expired cache entry', async () => {
      authorizationRepository.readAllByQuerystring.mockResolvedValue([
        anAuthorization((auth) => {
          auth.status = AuthorizationStatusEnum.Accepted;
          auth.cacheExpiryDateTime = new Date(Date.now() - 1000).toISOString();
        }),
      ]);

      expect((await decide201()).reason).toBe(AuthorizationAttemptReasonEnum.CacheExpired);
      expect((await decide16()).reason).toBe(AuthorizationAttemptReasonEnum.CacheExpired);
    });

    it('blames a concurrent transaction', async () => {
      authorizationRepository.readAllByQuerystring.mockResolvedValue([
        anAuthorization((auth) => {
          auth.status = AuthorizationStatusEnum.Accepted;
          auth.concurrentTransaction = false;
        }),
      ]);
      transactionRepositoryMock.readAllActiveTransactionsByAuthorizationId.mockResolvedValue([
        aTransaction(),
      ]);

      expect((await decide201()).reason).toBe(AuthorizationAttemptReasonEnum.ConcurrentTx);
      expect((await decide16()).reason).toBe(AuthorizationAttemptReasonEnum.ConcurrentTx);
    });

    it('blames the authorizer chain when an authorizer turns an Accepted token down', async () => {
      authorizationRepository.readAllByQuerystring.mockResolvedValue([
        anAuthorization((auth) => {
          auth.status = AuthorizationStatusEnum.Accepted;
          auth.cacheExpiryDateTime = undefined;
        }),
      ]);
      realTimeAuthorizer.authorize.mockResolvedValue(AuthorizationStatusEnum.Blocked);

      expect((await decide201()).reason).toBe(AuthorizationAttemptReasonEnum.AuthorizerRejected);
      expect((await decide16()).reason).toBe(AuthorizationAttemptReasonEnum.AuthorizerRejected);
    });

    it('reports Accepted when every check passes', async () => {
      authorizationRepository.readAllByQuerystring.mockResolvedValue([
        anAuthorization((auth) => {
          auth.status = AuthorizationStatusEnum.Accepted;
          auth.cacheExpiryDateTime = undefined;
        }),
      ]);

      expect((await decide201()).reason).toBe(AuthorizationAttemptReasonEnum.Accepted);
      expect((await decide16()).reason).toBe(AuthorizationAttemptReasonEnum.Accepted);
    });

    it('reports NoAuthorization for a token that is never looked up', async () => {
      const decision = newAuthorizationDecision();
      await transactionService.authorizeOcpp21IdToken(
        DEFAULT_TENANT_ID,
        aTransactionEventRequest((item) => {
          item.idToken = { idToken: '', type: OCPP2_0_1.IdTokenEnumType.NoAuthorization };
        }),
        aMessageContext(),
        decision,
      );

      expect(decision).toEqual({ reason: AuthorizationAttemptReasonEnum.NoAuthorization });
    });

    it('leaves Error behind when the 1.6 evaluation throws', async () => {
      authorizationRepository.readAllByQuerystring.mockRejectedValue(new Error('db down'));

      expect((await decide16()).reason).toBe(AuthorizationAttemptReasonEnum.Error);
    });
  });
});
