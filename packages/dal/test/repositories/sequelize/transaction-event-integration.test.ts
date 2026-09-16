// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { MeterValueDto, SampledValue, SystemConfig } from '@citrineos/types';
import {
  IdTokenEnum,
  MeasurandEnum,
  OCPP1_6,
  OCPP2_0_1,
  ReadingContextEnum,
} from '@citrineos/types';
import {
  Authorization,
  ChargingStation,
  Connector,
  Evse,
  MeterValue,
  SequelizeTransactionEventRepository,
  StartTransaction,
  StopTransaction,
  Tariff,
  Transaction,
  TransactionEvent,
} from '../../../index.js';
import { type PgHarness, resetDb, startPgHarness } from '../../utils/pg-harness.js';

// SequelizeTransactionEventRepository turns OCPP transaction traffic into Transaction,
// TransactionEvent, StartTransaction, StopTransaction and MeterValue rows. Transactions are
// keyed on (ocppConnectionName, transactionId); totalKwh derives from
// Energy.Active.Import.Register readings relative to meterStart.

const TENANT_A = 1;
const TENANT_B = 2;
const STATION = 'CS-A';
const TX = 'TX-001';
const TOKEN = 'DRIVER-1';

const T0 = '2025-06-01T10:00:00.000Z';
const T1 = '2025-06-01T10:30:00.000Z';
const T2 = '2025-06-01T11:00:00.000Z';

let h: PgHarness;

beforeAll(async () => {
  h = await startPgHarness();
}, 90_000);

afterAll(async () => {
  await h.stop();
});

beforeEach(async () => {
  await resetDb(h);
});

function makeRepo(): SequelizeTransactionEventRepository {
  return new SequelizeTransactionEventRepository({
    config: {} as SystemConfig,
    sequelizeInstance: h.sequelizeInstance,
  });
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function aStation(ocppConnectionName = STATION, tenantId = TENANT_A) {
  return ChargingStation.create({ ocppConnectionName, isOnline: true, tenantId } as any);
}

async function anAuthorization(idToken = TOKEN, tenantId = TENANT_A) {
  return Authorization.create({
    idToken,
    idTokenType: IdTokenEnum.ISO14443,
    status: 'Accepted',
    tenantId,
  } as any);
}

async function aTariff(tariffId: string, tenantId = TENANT_A) {
  return Tariff.create({ currency: 'EUR', pricePerKwh: 0.3, tariffId, tenantId } as any);
}

async function anEvse(evseTypeId: number, ocppConnectionName = STATION, tenantId = TENANT_A) {
  return Evse.create({ tenantId, ocppConnectionName, evseTypeId } as any);
}

async function aTransactionRow(overrides: Record<string, unknown> = {}) {
  return Transaction.create({
    tenantId: TENANT_A,
    ocppConnectionName: STATION,
    transactionId: TX,
    isActive: true,
    ...overrides,
  } as any);
}

function aTxEvent(
  eventType: OCPP2_0_1.TransactionEventEnumType,
  overrides: Record<string, unknown> = {},
): OCPP2_0_1.TransactionEventRequest {
  return {
    eventType,
    timestamp: T0,
    triggerReason: OCPP2_0_1.TriggerReasonEnumType.CablePluggedIn,
    seqNo: 0,
    transactionInfo: { transactionId: TX },
    ...overrides,
  } as OCPP2_0_1.TransactionEventRequest;
}

// Register reading in the OCPP 2.0.1 request shape.
function aRegisterSample(kwh: number, timestamp: string): OCPP2_0_1.MeterValueType {
  return {
    timestamp,
    sampledValue: [
      {
        value: kwh,
        measurand: OCPP2_0_1.MeasurandEnumType.Energy_Active_Import_Register,
        context: OCPP2_0_1.ReadingContextEnumType.Sample_Periodic,
        unitOfMeasure: { unit: 'kWh' },
      },
    ],
  } as OCPP2_0_1.MeterValueType;
}

// Register reading in the already-mapped DTO shape the 1.6 paths receive.
function aDtoReading(kwh: number, timestamp: string): MeterValueDto {
  return {
    tenantId: TENANT_A,
    timestamp,
    sampledValue: [
      {
        value: kwh,
        measurand: MeasurandEnum['Energy.Active.Import.Register'],
        context: ReadingContextEnum['Sample.Periodic'],
        unitOfMeasure: { unit: 'kWh', multiplier: 0 },
      },
    ] as [SampledValue, ...SampledValue[]],
  };
}

describe('SequelizeTransactionEventRepository', () => {
  describe('createOrUpdateTransactionByTransactionEventAndStationId', () => {
    it('Started event creates the transaction, event and meter value, seeding meterStart and totalKwh', async () => {
      await aStation();
      const auth = await anAuthorization();

      const tx = await makeRepo().createOrUpdateTransactionByTransactionEventAndStationId(
        TENANT_A,
        aTxEvent(OCPP2_0_1.TransactionEventEnumType.Started, {
          idToken: { idToken: TOKEN, type: OCPP2_0_1.IdTokenEnumType.ISO14443 },
          meterValue: [aRegisterSample(1, T0)],
          transactionInfo: {
            transactionId: TX,
            chargingState: OCPP2_0_1.ChargingStateEnumType.Charging,
          },
        }),
        STATION,
      );

      expect(tx.transactionId).toBe(TX);
      expect(tx.isActive).toBe(true);
      expect(tx.startTime).toBe(T0);
      expect(tx.tenantId).toBe(TENANT_A);
      expect(tx.authorizationId).toBe(auth.id);
      expect(tx.chargingState).toBe('Charging');
      expect(Number(tx.meterStart)).toBe(1);
      expect(Number(tx.totalKwh)).toBe(0);
      expect(tx.meterValues).toHaveLength(1);

      expect(await Transaction.count()).toBe(1);
      const events = await TransactionEvent.findAll();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('Started');
      expect(events[0].seqNo).toBe(0);
      expect(events[0].ocppConnectionName).toBe(STATION);
      expect(events[0].transactionDatabaseId).toBe(tx.id);
      expect(events[0].idTokenValue).toBe(TOKEN);
      expect(events[0].idTokenType).toBe('ISO14443');

      const meterValues = await MeterValue.findAll();
      expect(meterValues).toHaveLength(1);
      expect(meterValues[0].transactionEventId).toBe(events[0].id);
      expect(meterValues[0].transactionDatabaseId).toBe(tx.id);
      expect(meterValues[0].transactionId).toBe(TX);
      expect(meterValues[0].tenantId).toBe(TENANT_A);
    });

    it('creates evse and connector rows on demand for an unseen topology', async () => {
      const station = await aStation();

      const tx = await makeRepo().createOrUpdateTransactionByTransactionEventAndStationId(
        TENANT_A,
        aTxEvent(OCPP2_0_1.TransactionEventEnumType.Started, {
          evse: { id: 2, connectorId: 3 },
        }),
        STATION,
      );

      const evses = await Evse.findAll();
      expect(evses).toHaveLength(1);
      expect(evses[0].evseTypeId).toBe(2);
      expect(evses[0].ocppConnectionName).toBe(STATION);
      expect(evses[0].stationId).toBe(station.id);

      const connectors = await Connector.findAll();
      expect(connectors).toHaveLength(1);
      expect(connectors[0].evseId).toBe(evses[0].id);
      expect(connectors[0].evseTypeConnectorId).toBe(3);
      expect(connectors[0].connectorId).toBe(3);

      expect(tx.evseId).toBe(evses[0].id);
      expect(tx.connectorId).toBe(connectors[0].id);
      expect(tx.tariffId ?? null).toBeNull();
    });

    it('reuses a pre-provisioned connector and picks up its tariff', async () => {
      await aStation();
      const tariff = await aTariff('ac-fast');
      const evse = await anEvse(1);
      const connector = await Connector.create({
        tenantId: TENANT_A,
        ocppConnectionName: STATION,
        evseId: evse.id,
        connectorId: 1,
        evseTypeConnectorId: 1,
        status: 'Available',
        timestamp: T0,
        tariffId: tariff.id,
      } as any);

      const tx = await makeRepo().createOrUpdateTransactionByTransactionEventAndStationId(
        TENANT_A,
        aTxEvent(OCPP2_0_1.TransactionEventEnumType.Started, {
          evse: { id: 1, connectorId: 1 },
        }),
        STATION,
      );

      expect(tx.evseId).toBe(evse.id);
      expect(tx.connectorId).toBe(connector.id);
      expect(tx.tariffId).toBe(tariff.id);
      expect(await Evse.count()).toBe(1);
      expect(await Connector.count()).toBe(1);
    });

    it('Updated event reuses the transaction row and accumulates totalKwh from meterStart', async () => {
      await aStation();
      const repo = makeRepo();

      const started = await repo.createOrUpdateTransactionByTransactionEventAndStationId(
        TENANT_A,
        aTxEvent(OCPP2_0_1.TransactionEventEnumType.Started, {
          meterValue: [aRegisterSample(1, T0)],
        }),
        STATION,
      );
      const updated = await repo.createOrUpdateTransactionByTransactionEventAndStationId(
        TENANT_A,
        aTxEvent(OCPP2_0_1.TransactionEventEnumType.Updated, {
          timestamp: T1,
          seqNo: 1,
          triggerReason: OCPP2_0_1.TriggerReasonEnumType.MeterValuePeriodic,
          meterValue: [aRegisterSample(5.5, T1)],
        }),
        STATION,
      );

      expect(updated.id).toBe(started.id);
      expect(await Transaction.count()).toBe(1);
      expect(await TransactionEvent.count()).toBe(2);
      expect(await MeterValue.count()).toBe(2);

      const row = (await Transaction.findByPk(started.id))!;
      expect(row.isActive).toBe(true);
      expect(Number(row.meterStart)).toBe(1);
      expect(Number(row.totalKwh)).toBe(4.5);
    });

    it('Ended event deactivates the transaction and stamps endTime', async () => {
      await aStation();
      const repo = makeRepo();

      await repo.createOrUpdateTransactionByTransactionEventAndStationId(
        TENANT_A,
        aTxEvent(OCPP2_0_1.TransactionEventEnumType.Started, {
          meterValue: [aRegisterSample(1, T0)],
        }),
        STATION,
      );
      const ended = await repo.createOrUpdateTransactionByTransactionEventAndStationId(
        TENANT_A,
        aTxEvent(OCPP2_0_1.TransactionEventEnumType.Ended, {
          timestamp: T2,
          seqNo: 2,
          triggerReason: OCPP2_0_1.TriggerReasonEnumType.EVDeparted,
          meterValue: [aRegisterSample(8, T2)],
        }),
        STATION,
      );

      expect(ended.isActive).toBe(false);
      expect(ended.endTime).toBe(T2);
      expect(Number(ended.totalKwh)).toBe(7);

      const row = (await Transaction.findByPk(ended.id))!;
      expect(row.isActive).toBe(false);
      expect(row.endTime).toBe(T2);
    });

    it('resolves an OCPP 2.1 transactionInfo.tariffId against the tenant tariffs on update', async () => {
      await aStation();
      const tariff = await aTariff('ocpi-1');
      const repo = makeRepo();

      await repo.createOrUpdateTransactionByTransactionEventAndStationId(
        TENANT_A,
        aTxEvent(OCPP2_0_1.TransactionEventEnumType.Started),
        STATION,
      );
      const updated = await repo.createOrUpdateTransactionByTransactionEventAndStationId(
        TENANT_A,
        aTxEvent(OCPP2_0_1.TransactionEventEnumType.Updated, {
          seqNo: 1,
          transactionInfo: { transactionId: TX, tariffId: 'ocpi-1' },
        }),
        STATION,
      );

      expect(updated.tariffId).toBe(tariff.id);
    });

    it('keeps the same transactionId on two stations as two transactions', async () => {
      await aStation('CS-A');
      await aStation('CS-B');
      const repo = makeRepo();

      const txA = await repo.createOrUpdateTransactionByTransactionEventAndStationId(
        TENANT_A,
        aTxEvent(OCPP2_0_1.TransactionEventEnumType.Started),
        'CS-A',
      );
      const txB = await repo.createOrUpdateTransactionByTransactionEventAndStationId(
        TENANT_A,
        aTxEvent(OCPP2_0_1.TransactionEventEnumType.Started),
        'CS-B',
      );

      expect(txA.id).not.toBe(txB.id);
      expect(await Transaction.count()).toBe(2);
    });

    it('does not link an authorization owned by another tenant', async () => {
      await aStation('CS-B-1', TENANT_B);
      await anAuthorization(TOKEN, TENANT_A);
      const repo = makeRepo();

      const tx = await repo.createOrUpdateTransactionByTransactionEventAndStationId(
        TENANT_B,
        aTxEvent(OCPP2_0_1.TransactionEventEnumType.Started, {
          idToken: { idToken: TOKEN, type: OCPP2_0_1.IdTokenEnumType.ISO14443 },
        }),
        'CS-B-1',
      );

      expect(tx.tenantId).toBe(TENANT_B);
      expect(tx.authorizationId ?? null).toBeNull();
      const events = await TransactionEvent.findAll();
      expect(events).toHaveLength(1);
      expect(events[0].idTokenValue ?? null).toBeNull();

      expect(
        await repo.readTransactionByStationIdAndTransactionId(TENANT_A, 'CS-B-1', TX),
      ).toBeUndefined();
      const visible = await repo.readTransactionByStationIdAndTransactionId(TENANT_B, 'CS-B-1', TX);
      expect(visible!.id).toBe(tx.id);
    });
  });

  describe('transaction reads', () => {
    it('readAllTransactionsByStationIdAndEvseAndChargingStates filters by evse, connector and state', async () => {
      await aStation();
      const evse1 = await anEvse(1);
      const evse2 = await anEvse(2);
      const connector = await Connector.create({
        tenantId: TENANT_A,
        ocppConnectionName: STATION,
        evseId: evse1.id,
        connectorId: 1,
        evseTypeConnectorId: 1,
        status: 'Available',
        timestamp: T0,
      } as any);
      await aTransactionRow({
        transactionId: 'T-1',
        evseId: evse1.id,
        connectorId: connector.id,
        chargingState: 'Charging',
      });
      await aTransactionRow({
        transactionId: 'T-2',
        evseId: evse2.id,
        chargingState: 'EVConnected',
      });
      const repo = makeRepo();

      const charging = await repo.readAllTransactionsByStationIdAndEvseAndChargingStates(
        TENANT_A,
        STATION,
        { id: 1, connectorId: 1 } as OCPP2_0_1.EVSEType,
        [OCPP2_0_1.ChargingStateEnumType.Charging],
      );
      const all = await repo.readAllTransactionsByStationIdAndEvseAndChargingStates(
        TENANT_A,
        STATION,
      );
      const idle = await repo.readAllTransactionsByStationIdAndEvseAndChargingStates(
        TENANT_A,
        STATION,
        undefined,
        [OCPP2_0_1.ChargingStateEnumType.Idle],
      );

      expect(charging).toHaveLength(1);
      expect(charging[0].transactionId).toBe('T-1');
      expect(all).toHaveLength(2);
      expect(idle).toHaveLength(0);
    });

    it('readAllActiveTransactionsByAuthorizationId returns only the tenant active rows', async () => {
      await aStation();
      const auth = await anAuthorization();
      await aTransactionRow({ transactionId: 'T-1', authorizationId: auth.id, isActive: true });
      await aTransactionRow({ transactionId: 'T-2', authorizationId: auth.id, isActive: false });
      const repo = makeRepo();

      const active = await repo.readAllActiveTransactionsByAuthorizationId(TENANT_A, auth.id);
      const otherTenant = await repo.readAllActiveTransactionsByAuthorizationId(TENANT_B, auth.id);

      expect(active).toHaveLength(1);
      expect(active[0].transactionId).toBe('T-1');
      expect(otherTenant).toHaveLength(0);
    });

    it('findByTransactionId pulls events and meter values along', async () => {
      await aStation();
      const repo = makeRepo();
      await repo.createOrUpdateTransactionByTransactionEventAndStationId(
        TENANT_A,
        aTxEvent(OCPP2_0_1.TransactionEventEnumType.Started, {
          meterValue: [aRegisterSample(1, T0)],
        }),
        STATION,
      );
      await repo.createOrUpdateTransactionByTransactionEventAndStationId(
        TENANT_A,
        aTxEvent(OCPP2_0_1.TransactionEventEnumType.Updated, {
          seqNo: 1,
          meterValue: [aRegisterSample(2, T1)],
        }),
        STATION,
      );

      const found = await repo.findByTransactionId(TENANT_A, TX);

      expect(found).toBeDefined();
      expect(found!.transactionId).toBe(TX);
      expect(found!.transactionEvents).toHaveLength(2);
      expect(found!.meterValues).toHaveLength(2);
      expect(await repo.findByTransactionId(TENANT_A, 'NOPE')).toBeUndefined();
    });

    it('getTransactions and getTransactionsCount honor the updatedAt window and limit', async () => {
      await aStation();
      await aTransactionRow({ transactionId: 'T-1' });
      await sleep(25);
      const boundary = new Date();
      await sleep(25);
      await aTransactionRow({ transactionId: 'T-2' });
      const repo = makeRepo();

      const all = await repo.getTransactions(TENANT_A);
      const after = await repo.getTransactions(TENANT_A, boundary);
      const before = await repo.getTransactions(TENANT_A, undefined, boundary);
      const limited = await repo.getTransactions(TENANT_A, undefined, undefined, undefined, 1);
      const offset = await repo.getTransactions(TENANT_A, undefined, undefined, 1);

      expect(all).toHaveLength(2);
      expect(after).toHaveLength(1);
      expect(after[0].transactionId).toBe('T-2');
      expect(before).toHaveLength(1);
      expect(before[0].transactionId).toBe('T-1');
      expect(limited).toHaveLength(1);
      expect(offset).toHaveLength(1);

      expect(await repo.getTransactionsCount(TENANT_A)).toBe(2);
      expect(await repo.getTransactionsCount(TENANT_A, boundary)).toBe(1);
      expect(await repo.getTransactionsCount(TENANT_A, undefined, boundary)).toBe(1);
    });

    it('getEvseIdsWithActiveTransactionByStationId lists evseTypeIds of active transactions only', async () => {
      await aStation();
      const evse = await anEvse(4);
      await aTransactionRow({ transactionId: 'T-1', evseId: evse.id, isActive: true });
      await aTransactionRow({ transactionId: 'T-2', evseId: evse.id, isActive: false });
      await aTransactionRow({ transactionId: 'T-3', isActive: true });

      const evseIds = await makeRepo().getEvseIdsWithActiveTransactionByStationId(
        TENANT_A,
        STATION,
      );

      expect(evseIds).toEqual([4]);
    });

    it('getActiveTransactionByStationIdAndEvseId picks the most recently updated active transaction', async () => {
      await aStation();
      const evse = await anEvse(1);
      const older = await aTransactionRow({ transactionId: 'T-OLD', evseId: evse.id });
      await aTransactionRow({ transactionId: 'T-NEW', evseId: evse.id });
      await sleep(15);
      await older.update({ chargingState: 'Charging' });
      const repo = makeRepo();

      const found = await repo.getActiveTransactionByStationIdAndEvseId(TENANT_A, STATION, 1);
      const noneOnEvse = await repo.getActiveTransactionByStationIdAndEvseId(TENANT_A, STATION, 9);

      expect(found!.transactionId).toBe('T-OLD');
      expect(noneOnEvse).toBeUndefined();
    });
  });

  describe('OCPP 1.6 start and stop', () => {
    it('createTransactionByStartTransaction builds the transaction from connector, tariff and sequence', async () => {
      await aStation();
      const tariff = await aTariff('ac-fast');
      const evse = await anEvse(1);
      const connector = await Connector.create({
        tenantId: TENANT_A,
        ocppConnectionName: STATION,
        evseId: evse.id,
        connectorId: 1,
        evseTypeConnectorId: 1,
        status: 'Available',
        timestamp: T0,
        tariffId: tariff.id,
      } as any);
      const auth = await anAuthorization('TAG-1');
      const repo = makeRepo();

      const request: OCPP1_6.StartTransactionRequest = {
        connectorId: 1,
        idTag: 'TAG-1',
        meterStart: 1500,
        timestamp: T0,
      };
      const tx = await repo.createTransactionByStartTransaction(TENANT_A, request, STATION);

      expect(tx.transactionId).toBe('1');
      expect(tx.isActive).toBe(true);
      expect(Number(tx.meterStart)).toBe(1.5);
      expect(tx.evseId).toBe(evse.id);
      expect(tx.connectorId).toBe(connector.id);
      expect(tx.tariffId).toBe(tariff.id);
      expect(tx.authorizationId).toBe(auth.id);
      expect(tx.startTime).toBe(T0);
      expect(tx.startTransaction).toBeDefined();
      expect(tx.startTransaction!.meterStart).toBe(1500);
      expect(tx.startTransaction!.connectorDatabaseId).toBe(connector.id);

      const second = await repo.createTransactionByStartTransaction(TENANT_A, request, STATION);
      expect(second.transactionId).toBe('2');
      expect(await StartTransaction.count()).toBe(2);
    });

    it('createTransactionByStartTransaction throws when the connector is unknown', async () => {
      await aStation();
      const repo = makeRepo();

      await expect(
        repo.createTransactionByStartTransaction(
          TENANT_A,
          { connectorId: 9, idTag: 'TAG-1', meterStart: 100, timestamp: T0 },
          STATION,
        ),
      ).rejects.toThrow('Unable to find connector 9.');

      expect(await Transaction.count()).toBe(0);
      expect(await StartTransaction.count()).toBe(0);
    });

    it('createStopTransaction stores the stop row, closes the transaction and attaches readings', async () => {
      await aStation();
      const tx = await aTransactionRow();
      const stopTime = new Date(T2);

      const stop = await makeRepo().createStopTransaction(
        TENANT_A,
        tx.id,
        STATION,
        42500,
        stopTime,
        [aDtoReading(9, T2)],
        'EVDisconnected',
      );

      expect(Number(stop.meterStop)).toBe(42500);
      expect(stop.reason).toBe('EVDisconnected');
      expect(stop.transactionDatabaseId).toBe(tx.id);
      expect(stop.tenantId).toBe(TENANT_A);

      const row = (await Transaction.findByPk(tx.id))!;
      expect(row.isActive).toBe(false);
      expect(row.endTime).toBe(T2);

      const meterValues = await MeterValue.findAll();
      expect(meterValues).toHaveLength(1);
      expect(meterValues[0].stopTransactionDatabaseId).toBe(stop.id);
      expect(meterValues[0].transactionDatabaseId).toBe(tx.id);
    });

    it('createStopTransaction throws for a missing transaction', async () => {
      await expect(
        makeRepo().createStopTransaction(TENANT_A, 12345, STATION, 0, new Date(T2), []),
      ).rejects.toThrow('Transaction with id 12345 not found.');
      expect(await StopTransaction.count()).toBe(0);
    });
  });

  describe('meter values', () => {
    it('createMeterValue persists a standalone reading with mapper defaults applied', async () => {
      const tx = await aTransactionRow();

      const saved = await makeRepo().createMeterValue(
        TENANT_A,
        { timestamp: T0, sampledValue: [{ value: 42, unitOfMeasure: {} }] } as any,
        tx.id,
        TX,
        null,
      );

      expect(saved.tenantId).toBe(TENANT_A);
      expect(saved.transactionDatabaseId).toBe(tx.id);
      expect(saved.transactionId).toBe(TX);
      expect(saved.transactionEventId ?? null).toBeNull();
      expect(saved.timestamp).toBe(T0);
      expect(saved.sampledValue[0].value).toBe(42);
      expect(saved.sampledValue[0].measurand).toBe('Energy.Active.Import.Register');
      expect(saved.sampledValue[0].unitOfMeasure).toEqual({ unit: 'Wh', multiplier: 0 });
    });

    it('updateTransactionByMeterValues seeds meterStart and totalKwh from register readings', async () => {
      await aStation();
      const tx = await aTransactionRow({ transactionId: '42' });
      const repo = makeRepo();

      await repo.updateTransactionByMeterValues(
        TENANT_A,
        [aDtoReading(2, T0), aDtoReading(6, T1)],
        STATION,
        42,
      );

      const row = (await Transaction.findByPk(tx.id))!;
      expect(Number(row.meterStart)).toBe(2);
      expect(Number(row.totalKwh)).toBe(4);

      const stored = await repo.readAllMeterValuesByTransactionDataBaseId(TENANT_A, tx.id);
      expect(stored).toHaveLength(2);
      expect(stored[0].transactionId).toBe('42');
      expect(stored[0].transactionDatabaseId).toBe(tx.id);
    });

    it('updateTransactionByMeterValues writes nothing when the transaction is unknown', async () => {
      await aStation();

      await makeRepo().updateTransactionByMeterValues(TENANT_A, [aDtoReading(2, T0)], STATION, 77);

      expect(await MeterValue.count()).toBe(0);
    });
  });

  describe('transaction updates', () => {
    it('updateTransactionTotalCostById sets totalCost on the row', async () => {
      const tx = await aTransactionRow();

      await makeRepo().updateTransactionTotalCostById(TENANT_A, 12.34, tx.id);

      const row = (await Transaction.findByPk(tx.id))!;
      expect(Number(row.totalCost)).toBe(12.34);
    });

    it('updateTransactionByStationIdAndTransactionId updates the matching row only', async () => {
      const tx = await aTransactionRow({ chargingState: 'Charging' });
      const repo = makeRepo();

      const updated = await repo.updateTransactionByStationIdAndTransactionId(
        TENANT_A,
        { chargingState: 'SuspendedEV' } as Partial<Transaction>,
        TX,
        STATION,
      );
      const miss = await repo.updateTransactionByStationIdAndTransactionId(
        TENANT_A,
        { chargingState: 'Idle' } as Partial<Transaction>,
        TX,
        'CS-UNKNOWN',
      );

      expect(updated!.id).toBe(tx.id);
      expect(updated!.chargingState).toBe('SuspendedEV');
      expect(miss).toBeUndefined();
      expect((await Transaction.findByPk(tx.id))!.chargingState).toBe('SuspendedEV');
    });

    it('deactivateActiveTransactionsByStationIdAndEvseId deactivates other active transactions on the evse', async () => {
      await aStation();
      const evse = await anEvse(1);
      const otherEvse = await anEvse(2);
      const kept = await aTransactionRow({ transactionId: 'KEEP', evseId: evse.id });
      await aTransactionRow({ transactionId: 'DROP', evseId: evse.id });
      const elsewhere = await aTransactionRow({ transactionId: 'ELSE', evseId: otherEvse.id });
      const repo = makeRepo();

      const shortCircuit = await repo.deactivateActiveTransactionsByStationIdAndEvseId(
        TENANT_A,
        STATION,
        1,
        '0',
      );
      expect(shortCircuit).toEqual([]);

      const deactivated = await repo.deactivateActiveTransactionsByStationIdAndEvseId(
        TENANT_A,
        STATION,
        1,
        'KEEP',
      );

      expect(deactivated).toHaveLength(1);
      expect(deactivated[0].transactionId).toBe('DROP');
      expect(deactivated[0].isActive).toBe(false);
      expect((await Transaction.findByPk(kept.id))!.isActive).toBe(true);
      expect((await Transaction.findByPk(elsewhere.id))!.isActive).toBe(true);
    });
  });
});
