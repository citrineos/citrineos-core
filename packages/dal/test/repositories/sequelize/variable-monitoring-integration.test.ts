// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { SystemConfig } from '@citrineos/types';
import { OCPP2_0_1, OCPP_CallAction } from '@citrineos/types';
import {
  ChargingStation,
  Component,
  SequelizeVariableMonitoringRepository,
  Variable,
} from '../../../index.js';
// Not re-exported from the package barrel.
import {
  EventData,
  VariableMonitoring,
  VariableMonitoringStatus,
} from '@dal/models/variable-monitoring/index.js';
import { type PgHarness, resetDb, startPgHarness } from '../../utils/pg-harness.js';

// SequelizeVariableMonitoringRepository persists monitors set on charging stations
// (SetVariableMonitoring / NotifyMonitoringReport) plus a status row per request
// outcome and NotifyEvent payloads. A monitor is keyed on
// (ocppConnectionName, componentId, variableId); the station-assigned OCPP monitor
// id lives in the `id` column, distinct from the databaseId primary key.

const TENANT_A = 1;
const TENANT_B = 2;
const STATION = 'cp001';

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

function makeRepo(): SequelizeVariableMonitoringRepository {
  return new SequelizeVariableMonitoringRepository({
    config: {} as SystemConfig,
    sequelizeInstance: h.sequelizeInstance,
  });
}

async function aComponent(name: string, instance?: string, tenantId = TENANT_A) {
  return Component.create({ name, instance: instance ?? null, tenantId } as any);
}

async function aVariable(name: string, tenantId = TENANT_A) {
  return Variable.create({ name, tenantId } as any);
}

async function aMonitoringRow(overrides: Record<string, unknown> = {}) {
  return VariableMonitoring.create({
    tenantId: TENANT_A,
    ocppConnectionName: STATION,
    id: 1,
    transaction: false,
    value: 42,
    type: OCPP2_0_1.MonitorEnumType.UpperThreshold,
    severity: 5,
    ...overrides,
  } as any);
}

function monitoringData(
  entries: [OCPP2_0_1.VariableMonitoringType, ...OCPP2_0_1.VariableMonitoringType[]],
): OCPP2_0_1.MonitoringDataType {
  return {
    component: { name: 'EVSE' },
    variable: { name: 'Power' },
    variableMonitoring: entries,
  };
}

describe('SequelizeVariableMonitoringRepository', () => {
  describe('createOrUpdateByMonitoringDataTypeAndStationId', () => {
    it('creates one row per monitor entry plus an Accepted status each', async () => {
      const component = await aComponent('EVSE');
      const variable = await aVariable('Power');

      const created = await makeRepo().createOrUpdateByMonitoringDataTypeAndStationId(
        TENANT_A,
        monitoringData([
          {
            id: 7,
            transaction: false,
            value: 42,
            type: OCPP2_0_1.MonitorEnumType.UpperThreshold,
            severity: 5,
          },
          {
            id: 8,
            transaction: true,
            value: 10,
            type: OCPP2_0_1.MonitorEnumType.Delta,
            severity: 3,
          },
        ]),
        String(component.id),
        String(variable.id),
        STATION,
      );

      expect(created).toHaveLength(2);
      expect(created.map((vm) => vm.id).sort()).toEqual([7, 8]);
      const first = created.find((vm) => vm.id === 7)!;
      expect(first.value).toBe(42);
      expect(first.type).toBe('UpperThreshold');
      expect(first.severity).toBe(5);
      expect(first.transaction).toBe(false);
      expect(first.tenantId).toBe(TENANT_A);
      expect(first.ocppConnectionName).toBe(STATION);
      expect(await VariableMonitoring.count()).toBe(2);

      const statuses = await VariableMonitoringStatus.findAll();
      expect(statuses).toHaveLength(2);
      expect(statuses.every((s) => s.status === 'Accepted')).toBe(true);
      expect(statuses.every((s) => s.statusInfo?.reasonCode === 'NotifyMonitoringReport')).toBe(
        true,
      );
      expect(statuses.map((s) => s.variableMonitoringId).sort()).toEqual(
        created.map((vm) => vm.databaseId).sort(),
      );
    });

    it('updates the row matched on station, component and variable instead of inserting', async () => {
      const component = await aComponent('EVSE');
      const variable = await aVariable('Power');
      const repo = makeRepo();

      const [original] = await repo.createOrUpdateByMonitoringDataTypeAndStationId(
        TENANT_A,
        monitoringData([
          {
            id: 7,
            transaction: false,
            value: 42,
            type: OCPP2_0_1.MonitorEnumType.UpperThreshold,
            severity: 5,
          },
        ]),
        String(component.id),
        String(variable.id),
        STATION,
      );

      const [updated] = await repo.createOrUpdateByMonitoringDataTypeAndStationId(
        TENANT_A,
        monitoringData([
          {
            id: 9,
            transaction: true,
            value: 99,
            type: OCPP2_0_1.MonitorEnumType.LowerThreshold,
            severity: 2,
          },
        ]),
        String(component.id),
        String(variable.id),
        STATION,
      );

      expect(updated.databaseId).toBe(original.databaseId);
      expect(updated.id).toBe(9);
      expect(updated.value).toBe(99);
      expect(updated.type).toBe('LowerThreshold');
      expect(updated.severity).toBe(2);
      expect(updated.transaction).toBe(true);
      expect(await VariableMonitoring.count()).toBe(1);
      // One Accepted status per request, both pointing at the same monitor.
      const statuses = await VariableMonitoringStatus.findAll();
      expect(statuses).toHaveLength(2);
      expect(statuses.map((s) => s.variableMonitoringId)).toEqual([
        original.databaseId,
        original.databaseId,
      ]);
    });

    it('links the row to the charging station that owns the connection name', async () => {
      const station = await ChargingStation.create({
        ocppConnectionName: STATION,
        isOnline: false,
        tenantId: TENANT_A,
      } as any);
      const component = await aComponent('EVSE');
      const variable = await aVariable('Power');

      const [created] = await makeRepo().createOrUpdateByMonitoringDataTypeAndStationId(
        TENANT_A,
        monitoringData([
          {
            id: 7,
            transaction: false,
            value: 42,
            type: OCPP2_0_1.MonitorEnumType.UpperThreshold,
            severity: 5,
          },
        ]),
        String(component.id),
        String(variable.id),
        STATION,
      );

      expect(created.stationId).toBe(station.id);
    });
  });

  describe('createOrUpdateBySetMonitoringDataTypeAndStationId', () => {
    it('creates a monitor without a station-assigned id', async () => {
      const component = await aComponent('Connector');
      const variable = await aVariable('Temperature');

      const created = await makeRepo().createOrUpdateBySetMonitoringDataTypeAndStationId(
        TENANT_A,
        {
          value: 100,
          type: OCPP2_0_1.MonitorEnumType.UpperThreshold,
          severity: 4,
          component: { name: 'Connector' },
          variable: { name: 'Temperature' },
        },
        String(component.id),
        String(variable.id),
        STATION,
      );

      const row = (await VariableMonitoring.findByPk(created.databaseId))!;
      expect(row.id).toBeNull();
      expect(row.value).toBe(100);
      expect(row.type).toBe('UpperThreshold');
      expect(row.severity).toBe(4);
      expect(row.ocppConnectionName).toBe(STATION);
      expect(row.tenantId).toBe(TENANT_A);
      expect(row.componentId).toBe(component.id);
      expect(row.variableId).toBe(variable.id);
      expect(await VariableMonitoring.count()).toBe(1);
    });

    it('updates the matched monitor in place, keeping its databaseId', async () => {
      const component = await aComponent('Connector');
      const variable = await aVariable('Temperature');
      const repo = makeRepo();

      const original = await repo.createOrUpdateBySetMonitoringDataTypeAndStationId(
        TENANT_A,
        {
          value: 100,
          type: OCPP2_0_1.MonitorEnumType.UpperThreshold,
          severity: 4,
          component: { name: 'Connector' },
          variable: { name: 'Temperature' },
        },
        String(component.id),
        String(variable.id),
        STATION,
      );

      const updated = await repo.createOrUpdateBySetMonitoringDataTypeAndStationId(
        TENANT_A,
        {
          id: 12,
          transaction: true,
          value: 250,
          type: OCPP2_0_1.MonitorEnumType.UpperThreshold,
          severity: 1,
          component: { name: 'Connector' },
          variable: { name: 'Temperature' },
        },
        String(component.id),
        String(variable.id),
        STATION,
      );

      expect(updated.databaseId).toBe(original.databaseId);
      expect(updated.id).toBe(12);
      expect(updated.value).toBe(250);
      expect(updated.severity).toBe(1);
      expect(updated.transaction).toBe(true);
      expect(await VariableMonitoring.count()).toBe(1);
      // Unlike the NotifyMonitoringReport path, no status row is written here.
      expect(await VariableMonitoringStatus.count()).toBe(0);
    });
  });

  describe('createVariableMonitoringStatus', () => {
    it('stores the action as the statusInfo reasonCode', async () => {
      const vm = await aMonitoringRow();

      await makeRepo().createVariableMonitoringStatus(
        TENANT_A,
        OCPP2_0_1.SetMonitoringStatusEnumType.Duplicate,
        OCPP_CallAction.SetVariableMonitoring,
        vm.databaseId,
      );

      const status = (await VariableMonitoringStatus.findOne())!;
      expect(status.status).toBe('Duplicate');
      expect(status.statusInfo).toEqual({ reasonCode: 'SetVariableMonitoring' });
      expect(status.variableMonitoringId).toBe(vm.databaseId);
      expect(status.tenantId).toBe(TENANT_A);
    });
  });

  describe('rejectAllVariableMonitoringsByStationId', () => {
    it('adds a Rejected status to every monitor on the station and no others', async () => {
      const vm1 = await aMonitoringRow({ id: 1 });
      const vm2 = await aMonitoringRow({ id: 2 });
      const otherStation = await aMonitoringRow({ id: 1, ocppConnectionName: 'cp002' });

      await makeRepo().rejectAllVariableMonitoringsByStationId(
        TENANT_A,
        OCPP_CallAction.SetVariableMonitoring,
        STATION,
      );

      const statuses = await VariableMonitoringStatus.findAll();
      expect(statuses).toHaveLength(2);
      expect(statuses.every((s) => s.status === 'Rejected')).toBe(true);
      expect(statuses.every((s) => s.statusInfo?.reasonCode === 'SetVariableMonitoring')).toBe(
        true,
      );
      expect(statuses.map((s) => s.variableMonitoringId).sort()).toEqual(
        [vm1.databaseId, vm2.databaseId].sort(),
      );
      expect(
        await VariableMonitoringStatus.count({
          where: { variableMonitoringId: otherStation.databaseId },
        }),
      ).toBe(0);
    });

    it("leaves another tenant's monitors on the same connection name alone", async () => {
      await aMonitoringRow({ id: 1, tenantId: TENANT_A });
      const tenantBRow = await aMonitoringRow({ id: 1, tenantId: TENANT_B });

      await makeRepo().rejectAllVariableMonitoringsByStationId(
        TENANT_B,
        OCPP_CallAction.SetVariableMonitoring,
        STATION,
      );

      const statuses = await VariableMonitoringStatus.findAll();
      expect(statuses).toHaveLength(1);
      expect(statuses[0].variableMonitoringId).toBe(tenantBRow.databaseId);
      expect(statuses[0].tenantId).toBe(TENANT_B);
    });
  });

  describe('rejectVariableMonitoringByIdAndStationId', () => {
    it('targets only the monitor with the given OCPP id', async () => {
      const vm1 = await aMonitoringRow({ id: 1 });
      await aMonitoringRow({ id: 2 });

      await makeRepo().rejectVariableMonitoringByIdAndStationId(
        TENANT_A,
        OCPP_CallAction.SetVariableMonitoring,
        1,
        STATION,
      );

      const statuses = await VariableMonitoringStatus.findAll();
      expect(statuses).toHaveLength(1);
      expect(statuses[0].variableMonitoringId).toBe(vm1.databaseId);
      expect(statuses[0].status).toBe('Rejected');
    });

    it('creates nothing when the station does not match', async () => {
      await aMonitoringRow({ id: 1 });

      await makeRepo().rejectVariableMonitoringByIdAndStationId(
        TENANT_A,
        OCPP_CallAction.SetVariableMonitoring,
        1,
        'cp999',
      );

      expect(await VariableMonitoringStatus.count()).toBe(0);
    });
  });

  describe('updateResultByStationId', () => {
    it('writes the station-assigned id and appends the status when accepted', async () => {
      const component = await aComponent('EVSE');
      const variable = await aVariable('Power');
      const vm = await aMonitoringRow({
        id: null,
        componentId: component.id,
        variableId: variable.id,
      });

      const result = await makeRepo().updateResultByStationId(
        TENANT_A,
        {
          status: OCPP2_0_1.SetMonitoringStatusEnumType.Accepted,
          id: 77,
          type: OCPP2_0_1.MonitorEnumType.UpperThreshold,
          severity: 5,
          component: { name: 'EVSE' },
          variable: { name: 'Power' },
          statusInfo: { reasonCode: 'MonitorInstalled' },
        },
        STATION,
      );

      expect(result.databaseId).toBe(vm.databaseId);
      expect(result.id).toBe(77);
      expect(result.statuses).toHaveLength(1);
      expect(result.statuses![0].status).toBe('Accepted');
      expect(result.statuses![0].statusInfo).toEqual({ reasonCode: 'MonitorInstalled' });
      expect((await VariableMonitoring.findByPk(vm.databaseId))!.id).toBe(77);
    });

    it('keeps the id column untouched for a rejected result', async () => {
      const component = await aComponent('EVSE');
      const variable = await aVariable('Power');
      const vm = await aMonitoringRow({
        id: 31,
        componentId: component.id,
        variableId: variable.id,
      });

      const result = await makeRepo().updateResultByStationId(
        TENANT_A,
        {
          status: OCPP2_0_1.SetMonitoringStatusEnumType.Rejected,
          id: 99,
          type: OCPP2_0_1.MonitorEnumType.UpperThreshold,
          severity: 5,
          component: { name: 'EVSE' },
          variable: { name: 'Power' },
        },
        STATION,
      );

      expect(result.databaseId).toBe(vm.databaseId);
      expect(result.id).toBe(31);
      expect(result.statuses).toHaveLength(1);
      expect(result.statuses![0].status).toBe('Rejected');
      expect((await VariableMonitoring.findByPk(vm.databaseId))!.id).toBe(31);
    });

    it('selects the monitor through the component instance', async () => {
      const bareComponent = await aComponent('EVSE');
      const instancedComponent = await aComponent('EVSE', '1');
      const variable = await aVariable('Power');
      await aMonitoringRow({ id: 41, componentId: bareComponent.id, variableId: variable.id });
      const instancedVm = await aMonitoringRow({
        id: 42,
        componentId: instancedComponent.id,
        variableId: variable.id,
      });

      const result = await makeRepo().updateResultByStationId(
        TENANT_A,
        {
          status: OCPP2_0_1.SetMonitoringStatusEnumType.Accepted,
          id: 88,
          type: OCPP2_0_1.MonitorEnumType.UpperThreshold,
          severity: 5,
          component: { name: 'EVSE', instance: '1' },
          variable: { name: 'Power' },
        },
        STATION,
      );

      expect(result.databaseId).toBe(instancedVm.databaseId);
      expect(result.id).toBe(88);
      const statuses = await VariableMonitoringStatus.findAll();
      expect(statuses).toHaveLength(1);
      expect(statuses[0].variableMonitoringId).toBe(instancedVm.databaseId);
    });

    it('throws when type and severity match no monitor', async () => {
      const component = await aComponent('EVSE');
      const variable = await aVariable('Power');
      await aMonitoringRow({ componentId: component.id, variableId: variable.id, severity: 5 });

      await expect(
        makeRepo().updateResultByStationId(
          TENANT_A,
          {
            status: OCPP2_0_1.SetMonitoringStatusEnumType.Accepted,
            id: 77,
            type: OCPP2_0_1.MonitorEnumType.UpperThreshold,
            severity: 9,
            component: { name: 'EVSE' },
            variable: { name: 'Power' },
          },
          STATION,
        ),
      ).rejects.toThrow(/Unable to update set monitoring result/);
      expect(await VariableMonitoringStatus.count()).toBe(0);
    });

    it("throws for another tenant's monitor", async () => {
      const component = await aComponent('EVSE');
      const variable = await aVariable('Power');
      const vm = await aMonitoringRow({
        id: 31,
        componentId: component.id,
        variableId: variable.id,
        tenantId: TENANT_A,
      });

      await expect(
        makeRepo().updateResultByStationId(
          TENANT_B,
          {
            status: OCPP2_0_1.SetMonitoringStatusEnumType.Accepted,
            id: 77,
            type: OCPP2_0_1.MonitorEnumType.UpperThreshold,
            severity: 5,
            component: { name: 'EVSE' },
            variable: { name: 'Power' },
          },
          STATION,
        ),
      ).rejects.toThrow(/Unable to update set monitoring result/);
      expect((await VariableMonitoring.findByPk(vm.databaseId))!.id).toBe(31);
    });
  });

  describe('createEventDatumByComponentIdAndVariableIdAndStationId', () => {
    it('persists the event with station, component and variable keys', async () => {
      const component = await aComponent('EVSE');
      const variable = await aVariable('Power');

      const created = await makeRepo().createEventDatumByComponentIdAndVariableIdAndStationId(
        TENANT_A,
        {
          eventId: 5,
          timestamp: '2026-01-01T00:00:00.000Z',
          trigger: OCPP2_0_1.EventTriggerEnumType.Alerting,
          actualValue: '42.1',
          eventNotificationType: OCPP2_0_1.EventNotificationEnumType.HardWiredMonitor,
          component: { name: 'EVSE' },
          variable: { name: 'Power' },
          techCode: 'T01',
          cleared: false,
        },
        String(component.id),
        String(variable.id),
        STATION,
      );

      expect(created.eventId).toBe(5);
      expect(created.trigger).toBe('Alerting');
      expect(created.actualValue).toBe('42.1');
      expect(created.tenantId).toBe(TENANT_A);
      expect(created.ocppConnectionName).toBe(STATION);
      expect(await EventData.count()).toBe(1);

      const row = (await EventData.findOne({ where: { eventId: 5 } }))!;
      expect(row.timestamp).toBe('2026-01-01T00:00:00.000Z');
      expect(row.eventNotificationType).toBe('HardWiredMonitor');
      expect(row.techCode).toBe('T01');
      expect(row.cleared).toBe(false);
      expect(row.componentId).toBe(component.id);
      expect(row.variableId).toBe(variable.id);
    });
  });
});
