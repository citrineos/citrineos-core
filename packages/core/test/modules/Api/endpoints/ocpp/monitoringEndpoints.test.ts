// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { EventGroup, OCPP2_0_1, OCPP_CallAction, OCPPVersion } from '@citrineos/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClearVariableMonitoringEndpoint } from '@modules/Api/src/module/endpoints/ocpp/2/monitoring/ClearVariableMonitoringEndpoint.js';
import { GetVariablesEndpoint } from '@modules/Api/src/module/endpoints/ocpp/2/monitoring/GetVariablesEndpoint.js';
import { SetVariableMonitoringEndpoint } from '@modules/Api/src/module/endpoints/ocpp/2/monitoring/SetVariableMonitoringEndpoint.js';
import { SetVariablesEndpoint } from '@modules/Api/src/module/endpoints/ocpp/2/monitoring/SetVariablesEndpoint.js';
import { createTestContainer, getTestInstance } from '@test/testContainer.js';

const STATION = 'cs001';
const CUSTOM_DATA = { vendorId: 'citrineos' };

function aVariableData(name: string): OCPP2_0_1.GetVariableDataType {
  return { component: { name: 'Ctrlr' }, variable: { name } };
}

function aSetVariableData(name: string): OCPP2_0_1.SetVariableDataType {
  return { attributeValue: '1', component: { name: 'Ctrlr' }, variable: { name } };
}

describe('monitoring message endpoints', () => {
  const { container } = createTestContainer();

  let sendCall: ReturnType<typeof vi.fn>;
  let getItemsPerMessage: ReturnType<typeof vi.fn>;
  let getBytesPerMessage: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    sendCall = vi.fn().mockResolvedValue({ success: true, payload: 'queued' });
    getItemsPerMessage = vi.fn().mockResolvedValue(undefined);
    getBytesPerMessage = vi.fn().mockResolvedValue(undefined);
  });

  const deviceModelService = () => ({
    getItemsPerMessageByComponentAndVariableInstanceAndStationId: getItemsPerMessage,
    getBytesPerMessageByComponentAndVariableInstanceAndStationId: getBytesPerMessage,
  });

  describe('SetVariablesEndpoint', () => {
    let createOrUpdateBySetVariablesDataAndStationId: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      createOrUpdateBySetVariablesDataAndStationId = vi.fn().mockResolvedValue([]);
    });

    const build = () =>
      getTestInstance(container, SetVariablesEndpoint, {
        ocppSender: { sendCall },
        deviceModelService: deviceModelService(),
        deviceModelRepository: { createOrUpdateBySetVariablesDataAndStationId },
      });

    const handle = (request: OCPP2_0_1.SetVariablesRequest) =>
      build().handle([STATION], request, undefined, DEFAULT_TENANT_ID, OCPPVersion.OCPP2_0_1);

    it('persists the requested values before sending', async () => {
      const request = { setVariableData: [aSetVariableData('A')] };

      await handle(request);

      expect(createOrUpdateBySetVariablesDataAndStationId).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        request.setVariableData,
        STATION,
        expect.any(String),
      );
      expect(sendCall).toHaveBeenCalledTimes(1);
    });

    it('sends everything in one call when the station declares no limit', async () => {
      await handle({ setVariableData: [aSetVariableData('A'), aSetVariableData('B')] });

      expect(sendCall).toHaveBeenCalledTimes(1);
      expect(sendCall.mock.calls[0][0].payload.setVariableData).toHaveLength(2);
    });

    it('splits into batches of itemsPerMessage', async () => {
      getItemsPerMessage.mockResolvedValue(1);

      await handle({ setVariableData: [aSetVariableData('A'), aSetVariableData('B')] });

      expect(sendCall).toHaveBeenCalledTimes(2);
      expect(sendCall.mock.calls[0][0]).toMatchObject({
        action: OCPP_CallAction.SetVariables,
        eventGroup: EventGroup.Monitoring,
      });
    });

    it('labels each confirmation with its batch start index', async () => {
      getItemsPerMessage.mockResolvedValue(1);

      const confirmations = await handle({
        setVariableData: [aSetVariableData('A'), aSetVariableData('B')],
      });

      expect(confirmations.map((confirmation) => confirmation.payload)).toEqual([
        'Batch [0]: queued',
        'Batch [1]: queued',
      ]);
    });

    it('preserves root-level request fields on every batch', async () => {
      getItemsPerMessage.mockResolvedValue(1);

      await handle({
        customData: CUSTOM_DATA,
        setVariableData: [aSetVariableData('A'), aSetVariableData('B')],
      });

      for (const call of sendCall.mock.calls) {
        expect(call[0].payload.customData).toEqual(CUSTOM_DATA);
      }
    });

    it('refuses a request larger than the station byte limit', async () => {
      // The three sibling endpoints in this file all enforce DeviceDataCtrlr.BytesPerMessage.
      getBytesPerMessage.mockResolvedValue(1);

      const confirmations = await handle({ setVariableData: [aSetVariableData('A')] });

      expect(confirmations[0].success).toBe(false);
      expect(String(confirmations[0].payload)).toContain('exceeds the limit of 1 bytes');
      expect(sendCall).not.toHaveBeenCalled();
    });

    it('does not persist the values when the request is over the byte limit', async () => {
      getBytesPerMessage.mockResolvedValue(1);

      await handle({ setVariableData: [aSetVariableData('A')] });

      expect(createOrUpdateBySetVariablesDataAndStationId).not.toHaveBeenCalled();
    });

    it('reports a persistence failure as an unsuccessful confirmation', async () => {
      createOrUpdateBySetVariablesDataAndStationId.mockRejectedValue(new Error('db down'));

      const confirmations = await handle({ setVariableData: [aSetVariableData('A')] });

      expect(confirmations).toEqual([{ success: false, payload: 'db down' }]);
      expect(sendCall).not.toHaveBeenCalled();
    });
  });

  describe('GetVariablesEndpoint', () => {
    const build = () =>
      getTestInstance(container, GetVariablesEndpoint, {
        ocppSender: { sendCall },
        deviceModelService: deviceModelService(),
      });

    const handle = (request: OCPP2_0_1.GetVariablesRequest) =>
      build().handle([STATION], request, undefined, DEFAULT_TENANT_ID, OCPPVersion.OCPP2_0_1);

    it('sends the requested variables', async () => {
      await handle({ getVariableData: [aVariableData('A')] });

      expect(sendCall.mock.calls[0][0]).toMatchObject({
        action: OCPP_CallAction.GetVariables,
        eventGroup: EventGroup.Monitoring,
      });
    });

    it('refuses a request larger than the station byte limit', async () => {
      getBytesPerMessage.mockResolvedValue(1);

      const confirmations = await handle({ getVariableData: [aVariableData('A')] });

      expect(confirmations[0].success).toBe(false);
      expect(String(confirmations[0].payload)).toContain('exceeds the limit of 1 bytes');
      expect(sendCall).not.toHaveBeenCalled();
    });

    it('sends when the request fits inside the byte limit', async () => {
      getBytesPerMessage.mockResolvedValue(100_000);

      const confirmations = await handle({ getVariableData: [aVariableData('A')] });

      expect(confirmations[0].success).toBe(true);
    });

    it('batches by itemsPerMessage and preserves root-level fields', async () => {
      getItemsPerMessage.mockResolvedValue(1);

      await handle({
        customData: CUSTOM_DATA,
        getVariableData: [aVariableData('A'), aVariableData('B')],
      });

      expect(sendCall).toHaveBeenCalledTimes(2);
      for (const call of sendCall.mock.calls) {
        expect(call[0].payload.customData).toEqual(CUSTOM_DATA);
      }
    });
  });

  describe('SetVariableMonitoringEndpoint', () => {
    let findComponentAndVariable: ReturnType<typeof vi.fn>;
    let createOrUpdateBySetMonitoringDataTypeAndStationId: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      findComponentAndVariable = vi.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]);
      createOrUpdateBySetMonitoringDataTypeAndStationId = vi.fn().mockResolvedValue(undefined);
    });

    const build = () =>
      getTestInstance(container, SetVariableMonitoringEndpoint, {
        ocppSender: { sendCall },
        deviceModelService: deviceModelService(),
        deviceModelRepository: { findComponentAndVariable },
        variableMonitoringRepository: { createOrUpdateBySetMonitoringDataTypeAndStationId },
      });

    const aMonitor = (
      override: Partial<OCPP2_0_1.SetMonitoringDataType> = {},
    ): OCPP2_0_1.SetMonitoringDataType => ({
      value: 5,
      type: OCPP2_0_1.MonitorEnumType.UpperThreshold,
      severity: 3,
      component: { name: 'Ctrlr' },
      variable: { name: 'A' },
      ...override,
    });

    const handle = (request: OCPP2_0_1.SetVariableMonitoringRequest) =>
      build().handle([STATION], request, undefined, DEFAULT_TENANT_ID, OCPPVersion.OCPP2_0_1);

    it('persists each monitor before sending', async () => {
      await handle({ setMonitoringData: [aMonitor()] });

      expect(createOrUpdateBySetMonitoringDataTypeAndStationId).toHaveBeenCalledTimes(1);
      expect(sendCall).toHaveBeenCalledTimes(1);
    });

    it('coerces a Delta monitor on a non-numeric variable to a value of 1', async () => {
      findComponentAndVariable.mockResolvedValue([
        { id: 1 },
        { id: 2, variableCharacteristics: { dataType: OCPP2_0_1.DataEnumType.string } },
      ]);
      const request = { setMonitoringData: [aMonitor({ type: OCPP2_0_1.MonitorEnumType.Delta })] };

      await handle(request);

      expect(request.setMonitoringData[0].value).toBe(1);
    });

    it('leaves a Delta monitor on a numeric variable untouched', async () => {
      findComponentAndVariable.mockResolvedValue([
        { id: 1 },
        { id: 2, variableCharacteristics: { dataType: OCPP2_0_1.DataEnumType.decimal } },
      ]);
      const request = { setMonitoringData: [aMonitor({ type: OCPP2_0_1.MonitorEnumType.Delta })] };

      await handle(request);

      expect(request.setMonitoringData[0].value).toBe(5);
    });

    it('skips persistence when the component or variable is unknown', async () => {
      findComponentAndVariable.mockResolvedValue([undefined, undefined]);

      await handle({ setMonitoringData: [aMonitor()] });

      expect(createOrUpdateBySetMonitoringDataTypeAndStationId).not.toHaveBeenCalled();
      expect(sendCall).toHaveBeenCalledTimes(1);
    });

    it('refuses a request larger than the station byte limit', async () => {
      getBytesPerMessage.mockResolvedValue(1);

      const confirmations = await handle({ setMonitoringData: [aMonitor()] });

      expect(confirmations[0].success).toBe(false);
      expect(sendCall).not.toHaveBeenCalled();
    });

    it('preserves root-level request fields across batches', async () => {
      getItemsPerMessage.mockResolvedValue(1);

      await handle({
        customData: CUSTOM_DATA,
        setMonitoringData: [aMonitor(), aMonitor({ variable: { name: 'B' } })],
      });

      expect(sendCall).toHaveBeenCalledTimes(2);
      for (const call of sendCall.mock.calls) {
        expect(call[0].payload.customData).toEqual(CUSTOM_DATA);
      }
    });
  });

  describe('ClearVariableMonitoringEndpoint', () => {
    const build = () =>
      getTestInstance(container, ClearVariableMonitoringEndpoint, {
        ocppSender: { sendCall },
        deviceModelService: deviceModelService(),
      });

    const handle = (request: OCPP2_0_1.ClearVariableMonitoringRequest) =>
      build().handle([STATION], request, undefined, DEFAULT_TENANT_ID, OCPPVersion.OCPP2_0_1);

    it('sends the ids to clear', async () => {
      await handle({ id: [1, 2] });

      expect(sendCall.mock.calls[0][0]).toMatchObject({
        action: OCPP_CallAction.ClearVariableMonitoring,
        eventGroup: EventGroup.Monitoring,
      });
      expect(sendCall.mock.calls[0][0].payload.id).toEqual([1, 2]);
    });

    it('batches ids by itemsPerMessage', async () => {
      getItemsPerMessage.mockResolvedValue(1);

      await handle({ id: [1, 2, 3] });

      expect(sendCall).toHaveBeenCalledTimes(3);
      expect(sendCall.mock.calls.map((call) => call[0].payload.id)).toEqual([[1], [2], [3]]);
    });

    it('refuses a request larger than the station byte limit', async () => {
      getBytesPerMessage.mockResolvedValue(1);

      const confirmations = await handle({ id: [1] });

      expect(confirmations[0].success).toBe(false);
      expect(sendCall).not.toHaveBeenCalled();
    });

    it('preserves root-level request fields across batches', async () => {
      getItemsPerMessage.mockResolvedValue(1);

      await handle({ customData: CUSTOM_DATA, id: [1, 2] });

      for (const call of sendCall.mock.calls) {
        expect(call[0].payload.customData).toEqual(CUSTOM_DATA);
      }
    });
  });
});
