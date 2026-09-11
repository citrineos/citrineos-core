// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { OCPP2_0_1, type SystemConfig } from '@citrineos/types';
import {
  Component,
  Connector,
  Evse,
  EvseType,
  Reservation,
  SequelizeMessageInfoRepository,
  SequelizeReservationRepository,
} from '../../../index.js';
import { MessageInfo } from '@dal/models/message-info/index.js';
import { type PgHarness, resetDb, startPgHarness } from '../../utils/pg-harness.js';

// SequelizeReservationRepository upserts ReserveNow requests keyed on
// (ocppConnectionName, tenantId, id); SequelizeMessageInfoRepository upserts
// display messages on the same composite key and deactivates them per station.

const TENANT_A = 1;
const TENANT_B = 2;
const STATION_A = 'cp001';
const STATION_B = 'cp002';

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

function reservationRepo(): SequelizeReservationRepository {
  return new SequelizeReservationRepository({
    config: {} as SystemConfig,
    sequelizeInstance: h.sequelizeInstance,
  });
}

function messageInfoRepo(): SequelizeMessageInfoRepository {
  return new SequelizeMessageInfoRepository({
    config: {} as SystemConfig,
    sequelizeInstance: h.sequelizeInstance,
  });
}

function aReserveNowRequest(
  overrides: Partial<OCPP2_0_1.ReserveNowRequest> = {},
): OCPP2_0_1.ReserveNowRequest {
  return {
    id: 42,
    expiryDateTime: '2031-06-01T10:00:00.000Z',
    idToken: { idToken: 'RFID-001', type: OCPP2_0_1.IdTokenEnumType.ISO14443 },
    ...overrides,
  };
}

function aMessageInfoType(
  overrides: Partial<OCPP2_0_1.MessageInfoType> = {},
): OCPP2_0_1.MessageInfoType {
  return {
    id: 7,
    priority: OCPP2_0_1.MessagePriorityEnumType.NormalCycle,
    message: { format: OCPP2_0_1.MessageFormatEnumType.UTF8, content: 'Welcome' },
    ...overrides,
  };
}

describe('SequelizeReservationRepository', () => {
  describe('createOrUpdateReservation', () => {
    it('creates a reservation without an evse and stores the request fields', async () => {
      const created = await reservationRepo().createOrUpdateReservation(
        TENANT_A,
        aReserveNowRequest(),
        STATION_A,
      );

      expect(created).toBeDefined();
      expect(created!.id).toBe(42);
      expect(created!.ocppConnectionName).toBe(STATION_A);
      expect(created!.tenantId).toBe(TENANT_A);
      expect(created!.expiryDateTime).toBe('2031-06-01T10:00:00.000Z');
      expect(created!.idToken).toEqual({ idToken: 'RFID-001', type: 'ISO14443' });
      expect(created!.groupIdToken).toBeNull();
      expect(created!.connectorType ?? null).toBeNull();
      expect(created!.isActive).toBe(false);
      expect(created!.evseId ?? null).toBeNull();
      expect(await Reservation.count()).toBe(1);
    });

    it('updates the existing row when the same (station, id) pair arrives again', async () => {
      const repo = reservationRepo();
      const first = await repo.createOrUpdateReservation(TENANT_A, aReserveNowRequest(), STATION_A);

      const second = await repo.createOrUpdateReservation(
        TENANT_A,
        aReserveNowRequest({
          expiryDateTime: '2031-07-01T10:00:00.000Z',
          connectorType: OCPP2_0_1.ConnectorEnumType.cType2,
          idToken: { idToken: 'RFID-002', type: OCPP2_0_1.IdTokenEnumType.ISO14443 },
          groupIdToken: { idToken: 'FLEET-01', type: OCPP2_0_1.IdTokenEnumType.Central },
        }),
        STATION_A,
      );

      expect(second!.databaseId).toBe(first!.databaseId);
      expect(second!.expiryDateTime).toBe('2031-07-01T10:00:00.000Z');
      expect(second!.connectorType).toBe('cType2');
      expect(second!.idToken).toEqual({ idToken: 'RFID-002', type: 'ISO14443' });
      expect(second!.groupIdToken).toEqual({ idToken: 'FLEET-01', type: 'Central' });
      expect(await Reservation.count()).toBe(1);
    });

    it('clears connectorType and groupIdToken when the update omits them', async () => {
      const repo = reservationRepo();
      await repo.createOrUpdateReservation(
        TENANT_A,
        aReserveNowRequest({
          connectorType: OCPP2_0_1.ConnectorEnumType.cType2,
          groupIdToken: { idToken: 'FLEET-01', type: OCPP2_0_1.IdTokenEnumType.Central },
        }),
        STATION_A,
      );

      const updated = await repo.createOrUpdateReservation(
        TENANT_A,
        aReserveNowRequest(),
        STATION_A,
      );

      expect(updated!.connectorType).toBeNull();
      expect(updated!.groupIdToken).toBeNull();
    });

    it('flips isActive on update when the argument is passed', async () => {
      const repo = reservationRepo();
      await repo.createOrUpdateReservation(TENANT_A, aReserveNowRequest(), STATION_A);

      const activated = await repo.createOrUpdateReservation(
        TENANT_A,
        aReserveNowRequest(),
        STATION_A,
        true,
      );
      expect(activated!.isActive).toBe(true);

      const deactivated = await repo.createOrUpdateReservation(
        TENANT_A,
        aReserveNowRequest(),
        STATION_A,
        false,
      );
      expect(deactivated!.isActive).toBe(false);
    });

    it('leaves isActive untouched when the argument is omitted on update', async () => {
      const repo = reservationRepo();
      await repo.createOrUpdateReservation(TENANT_A, aReserveNowRequest(), STATION_A);
      await repo.createOrUpdateReservation(TENANT_A, aReserveNowRequest(), STATION_A, true);

      const updated = await repo.createOrUpdateReservation(
        TENANT_A,
        aReserveNowRequest(),
        STATION_A,
      );

      expect(updated!.isActive).toBe(true);
    });

    it('resolves evseId to the databaseId of the connectorless evse row', async () => {
      const evse = await EvseType.create({ id: 2, connectorId: null, tenantId: TENANT_A } as any);
      // Same OCPP evse id with a connector attached; the lookup must skip it.
      const stationEvse = await Evse.create({
        ocppConnectionName: STATION_A,
        tenantId: TENANT_A,
      } as any);
      const connector = await Connector.create({
        ocppConnectionName: STATION_A,
        evseId: stationEvse.id,
        connectorId: 1,
        evseTypeConnectorId: evse.databaseId,
        tenantId: TENANT_A,
      } as any);
      await EvseType.create({ id: 2, connectorId: connector.id, tenantId: TENANT_A } as any);

      const created = await reservationRepo().createOrUpdateReservation(
        TENANT_A,
        aReserveNowRequest({ evseId: 2 }),
        STATION_A,
      );

      expect(created).toBeDefined();
      expect(created!.evseId).toBe(evse.databaseId);
    });

    it('returns undefined and creates nothing when the evse does not exist', async () => {
      const created = await reservationRepo().createOrUpdateReservation(
        TENANT_A,
        aReserveNowRequest({ evseId: 99 }),
        STATION_A,
      );

      expect(created).toBeUndefined();
      expect(await Reservation.count()).toBe(0);
    });

    it("does not resolve another tenant's evse", async () => {
      await EvseType.create({ id: 3, connectorId: null, tenantId: TENANT_B } as any);

      const created = await reservationRepo().createOrUpdateReservation(
        TENANT_A,
        aReserveNowRequest({ evseId: 3 }),
        STATION_A,
      );

      expect(created).toBeUndefined();
      expect(await Reservation.count()).toBe(0);
    });

    it('keeps the same reservation id on two stations as separate rows', async () => {
      const repo = reservationRepo();
      const onA = await repo.createOrUpdateReservation(TENANT_A, aReserveNowRequest(), STATION_A);
      const onB = await repo.createOrUpdateReservation(TENANT_A, aReserveNowRequest(), STATION_B);

      expect(onB!.databaseId).not.toBe(onA!.databaseId);
      expect(await Reservation.count()).toBe(2);

      await repo.createOrUpdateReservation(TENANT_A, aReserveNowRequest(), STATION_A, true);

      const rowB = await Reservation.findByPk(onB!.databaseId);
      expect(rowB!.isActive).toBe(false);
    });

    it('keeps the same (station, id) pair in two tenants as separate rows', async () => {
      const repo = reservationRepo();
      const forA = await repo.createOrUpdateReservation(TENANT_A, aReserveNowRequest(), STATION_A);
      const forB = await repo.createOrUpdateReservation(TENANT_B, aReserveNowRequest(), STATION_A);

      expect(forA!.tenantId).toBe(TENANT_A);
      expect(forB!.tenantId).toBe(TENANT_B);
      expect(forB!.databaseId).not.toBe(forA!.databaseId);
      expect(await Reservation.count()).toBe(2);

      await repo.createOrUpdateReservation(TENANT_B, aReserveNowRequest(), STATION_A, true);

      const rowA = await Reservation.findByPk(forA!.databaseId);
      expect(rowA!.isActive).toBe(false);
    });
  });

  describe('uniqueness', () => {
    it('rejects a duplicate (station, tenant, id) triple at the model level', async () => {
      await Reservation.create({
        id: 42,
        ocppConnectionName: STATION_A,
        tenantId: TENANT_A,
      } as any);

      await expect(
        Reservation.create({ id: 42, ocppConnectionName: STATION_A, tenantId: TENANT_A } as any),
      ).rejects.toMatchObject({ name: 'SequelizeUniqueConstraintError' });
      expect(await Reservation.count()).toBe(1);
    });
  });

  describe('getNextReservationId', () => {
    it('returns 1 when the station has no reservations', async () => {
      expect(await reservationRepo().getNextReservationId(TENANT_A, STATION_A)).toBe(1);
    });

    it('returns max id plus one, counting only the given station', async () => {
      await Reservation.create({ id: 5, ocppConnectionName: STATION_A, tenantId: TENANT_A } as any);
      await Reservation.create({ id: 9, ocppConnectionName: STATION_A, tenantId: TENANT_A } as any);
      await Reservation.create({ id: 3, ocppConnectionName: STATION_B, tenantId: TENANT_A } as any);

      const repo = reservationRepo();
      expect(await repo.getNextReservationId(TENANT_A, STATION_A)).toBe(10);
      expect(await repo.getNextReservationId(TENANT_A, STATION_B)).toBe(4);
    });
  });
});

describe('SequelizeMessageInfoRepository', () => {
  describe('createOrUpdateByMessageInfoTypeAndStationId', () => {
    it('creates an active message info with the request fields', async () => {
      const created = await messageInfoRepo().createOrUpdateByMessageInfoTypeAndStationId(
        TENANT_A,
        aMessageInfoType(),
        STATION_A,
      );

      expect(created.id).toBe(7);
      expect(created.ocppConnectionName).toBe(STATION_A);
      expect(created.tenantId).toBe(TENANT_A);
      expect(created.priority).toBe('NormalCycle');
      expect(created.state ?? null).toBeNull();
      expect(created.transactionId ?? null).toBeNull();
      expect(created.displayComponentId ?? null).toBeNull();
      expect(created.message).toEqual({ format: 'UTF8', content: 'Welcome' });
      expect(created.active).toBe(true);
      expect(await MessageInfo.count()).toBe(1);
    });

    it('updates in place when the same (station, id) pair arrives again', async () => {
      const repo = messageInfoRepo();
      const first = await repo.createOrUpdateByMessageInfoTypeAndStationId(
        TENANT_A,
        aMessageInfoType(),
        STATION_A,
      );

      const second = await repo.createOrUpdateByMessageInfoTypeAndStationId(
        TENANT_A,
        aMessageInfoType({
          priority: OCPP2_0_1.MessagePriorityEnumType.AlwaysFront,
          state: OCPP2_0_1.MessageStateEnumType.Charging,
          transactionId: 'tx-001',
          startDateTime: '2031-06-01T08:00:00.000Z',
          message: { format: OCPP2_0_1.MessageFormatEnumType.ASCII, content: 'Charging now' },
        }),
        STATION_A,
      );

      expect(second.databaseId).toBe(first.databaseId);
      expect(second.priority).toBe('AlwaysFront');
      expect(second.state).toBe('Charging');
      expect(second.transactionId).toBe('tx-001');
      expect(second.startDateTime).toBe('2031-06-01T08:00:00.000Z');
      expect(second.message).toEqual({ format: 'ASCII', content: 'Charging now' });
      expect(await MessageInfo.count()).toBe(1);
    });

    it('reactivates a deactivated message on upsert', async () => {
      const repo = messageInfoRepo();
      const created = await repo.createOrUpdateByMessageInfoTypeAndStationId(
        TENANT_A,
        aMessageInfoType(),
        STATION_A,
      );
      await repo.deactivateAllByStationId(TENANT_A, STATION_A);
      expect((await MessageInfo.findByPk(created.databaseId))!.active).toBe(false);

      const upserted = await repo.createOrUpdateByMessageInfoTypeAndStationId(
        TENANT_A,
        aMessageInfoType(),
        STATION_A,
      );

      expect(upserted.databaseId).toBe(created.databaseId);
      expect(upserted.active).toBe(true);
    });

    it('links the display component when componentId is passed', async () => {
      const component = await Component.create({ name: 'Display', tenantId: TENANT_A } as any);

      const created = await messageInfoRepo().createOrUpdateByMessageInfoTypeAndStationId(
        TENANT_A,
        aMessageInfoType(),
        STATION_A,
        component.id,
      );

      expect(created.displayComponentId).toBe(component.id);
    });
  });

  describe('deactivateAllByStationId', () => {
    it('deactivates only the given station within the given tenant', async () => {
      const repo = messageInfoRepo();
      await repo.createOrUpdateByMessageInfoTypeAndStationId(
        TENANT_A,
        aMessageInfoType({ id: 1 }),
        STATION_A,
      );
      await repo.createOrUpdateByMessageInfoTypeAndStationId(
        TENANT_A,
        aMessageInfoType({ id: 2 }),
        STATION_A,
      );
      await MessageInfo.create({
        id: 1,
        ocppConnectionName: STATION_B,
        tenantId: TENANT_A,
        priority: 'NormalCycle',
        message: { format: 'UTF8', content: 'other station' },
        active: true,
      } as any);
      await MessageInfo.create({
        id: 1,
        ocppConnectionName: STATION_A,
        tenantId: TENANT_B,
        priority: 'NormalCycle',
        message: { format: 'UTF8', content: 'other tenant' },
        active: true,
      } as any);

      await repo.deactivateAllByStationId(TENANT_A, STATION_A);

      const stationARows = await MessageInfo.findAll({
        where: { ocppConnectionName: STATION_A, tenantId: TENANT_A },
      });
      expect(stationARows).toHaveLength(2);
      expect(stationARows.every((row) => !row.active)).toBe(true);

      const stationBRow = await MessageInfo.findOne({
        where: { ocppConnectionName: STATION_B, tenantId: TENANT_A },
      });
      expect(stationBRow!.active).toBe(true);

      const tenantBRow = await MessageInfo.findOne({
        where: { ocppConnectionName: STATION_A, tenantId: TENANT_B },
      });
      expect(tenantBRow!.active).toBe(true);
    });

    it('resolves without touching anything for a station with no messages', async () => {
      await messageInfoRepo().createOrUpdateByMessageInfoTypeAndStationId(
        TENANT_A,
        aMessageInfoType(),
        STATION_A,
      );

      await messageInfoRepo().deactivateAllByStationId(TENANT_A, STATION_B);

      expect((await MessageInfo.findOne({ where: { id: 7 } }))!.active).toBe(true);
    });
  });

  describe('uniqueness', () => {
    it('rejects a duplicate (station, tenant, id) triple at the model level', async () => {
      await MessageInfo.create({
        id: 7,
        ocppConnectionName: STATION_A,
        tenantId: TENANT_A,
        priority: 'NormalCycle',
        message: { format: 'UTF8', content: 'first' },
        active: true,
      } as any);

      await expect(
        MessageInfo.create({
          id: 7,
          ocppConnectionName: STATION_A,
          tenantId: TENANT_A,
          priority: 'InFront',
          message: { format: 'UTF8', content: 'second' },
          active: true,
        } as any),
      ).rejects.toMatchObject({ name: 'SequelizeUniqueConstraintError' });
      expect(await MessageInfo.count()).toBe(1);
    });
  });
});
