// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { EventGroup, OCPP2_0_1, OCPP_CallAction, OCPPVersion } from '@citrineos/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SetStationPasswordEndpoint } from '@modules/Api/src/module/endpoints/SetStationPasswordEndpoint.js';
import { createTestContainer, getTestInstance } from '@test/testContainer.js';
import { mountEndpoint, type MountedEndpoint } from '@test/providers/endpointHarness.js';
import { aSystemConfig } from '@test/providers/systemConfig.js';

const URL = '/commands/setStationPassword';
const A_VALID_PASSWORD = 'Abcdef0123456789';

function anAcceptedSetVariablesResponse(): string {
  return JSON.stringify({
    setVariableResult: [{ attributeStatus: OCPP2_0_1.SetVariableStatusEnumType.Accepted }],
  });
}

function aVariableAttribute() {
  const attribute = {
    type: OCPP2_0_1.AttributeEnumType.Actual,
    component: { name: 'SecurityCtrlr' },
    variable: { name: 'BasicAuthPassword' },
    reload: vi.fn(),
  };
  attribute.reload.mockResolvedValue(attribute);
  return attribute;
}

describe('SetStationPasswordEndpoint', () => {
  const { container } = createTestContainer();

  let sendCall: ReturnType<typeof vi.fn>;
  let onChange: ReturnType<typeof vi.fn>;
  let provisionVariableAttributes: ReturnType<typeof vi.fn>;
  let readChargingStationByStationId: ReturnType<typeof vi.fn>;
  let mounted: MountedEndpoint;

  beforeEach(async () => {
    vi.clearAllMocks();
    sendCall = vi.fn().mockResolvedValue({ success: true, payload: 'queued' });
    onChange = vi.fn().mockResolvedValue(anAcceptedSetVariablesResponse());
    provisionVariableAttributes = vi.fn().mockResolvedValue([aVariableAttribute()]);
    readChargingStationByStationId = vi.fn().mockResolvedValue({ protocol: OCPPVersion.OCPP2_0_1 });

    const endpoint = getTestInstance(container, SetStationPasswordEndpoint, {
      config: aSystemConfig(),
      cache: { onChange },
      ocppSender: { sendCall },
      deviceModelService: { provisionVariableAttributes },
      chargingStationRepository: { readChargingStationByStationId },
    });
    mounted = await mountEndpoint(endpoint, SetStationPasswordEndpoint.route);
  });

  const post = (body: Record<string, unknown>) =>
    mounted.server.inject({
      method: 'POST',
      url: `${URL}?tenantId=${DEFAULT_TENANT_ID}`,
      payload: body,
    });

  describe('setOnCharger semantics', () => {
    it('does not contact the station when the password is already set on it', async () => {
      const response = await post({
        ocppConnectionName: 'cs001',
        password: A_VALID_PASSWORD,
        setOnCharger: true,
      });

      expect(response.json().success).toBe(true);
      expect(sendCall).not.toHaveBeenCalled();
      expect(provisionVariableAttributes).toHaveBeenCalledTimes(1);
    });

    it('requires an explicit password when the password is already set on the station', async () => {
      const response = await post({
        ocppConnectionName: 'cs001',
        setOnCharger: true,
      });

      expect(response.json()).toEqual({
        success: false,
        payload: 'Password is required when setOnCharger is true',
      });
      expect(sendCall).not.toHaveBeenCalled();
      expect(provisionVariableAttributes).not.toHaveBeenCalled();
    });

    it('contacts the station when the password is not already set on it', async () => {
      await post({
        ocppConnectionName: 'cs001',
        password: A_VALID_PASSWORD,
        setOnCharger: false,
      });

      expect(sendCall).toHaveBeenCalledTimes(1);
      expect(sendCall.mock.calls[0][0]).toMatchObject({
        ocppConnectionName: 'cs001',
        protocol: OCPPVersion.OCPP2_0_1,
        action: OCPP_CallAction.SetVariables,
        eventGroup: EventGroup.Monitoring,
      });
    });

    it('does not look up the station when the password is already set on it', async () => {
      await post({
        ocppConnectionName: 'cs001',
        password: A_VALID_PASSWORD,
        setOnCharger: true,
      });

      expect(readChargingStationByStationId).not.toHaveBeenCalled();
    });

    it('generates a password when none was supplied', async () => {
      await post({ ocppConnectionName: 'cs001', setOnCharger: false });

      const sent = sendCall.mock.calls[0][0].payload.setVariableData[0];
      expect(sent.attributeValue).toEqual(expect.any(String));
      expect(sent.attributeValue.length).toBeGreaterThan(0);
      expect(sent.variable).toEqual({ name: 'BasicAuthPassword' });
      expect(sent.component).toEqual({ name: 'SecurityCtrlr' });
    });
  });

  describe('station protocol', () => {
    it('sends using the protocol the station is recorded as speaking', async () => {
      readChargingStationByStationId.mockResolvedValue({ protocol: OCPPVersion.OCPP2_1 });

      await post({
        ocppConnectionName: 'cs001',
        password: A_VALID_PASSWORD,
        setOnCharger: false,
      });

      expect(sendCall.mock.calls[0][0].protocol).toBe(OCPPVersion.OCPP2_1);
    });

    it('refuses a station whose protocol cannot serve the request', async () => {
      readChargingStationByStationId.mockResolvedValue({ protocol: OCPPVersion.OCPP1_6 });

      const response = await post({
        ocppConnectionName: 'cs001',
        password: A_VALID_PASSWORD,
        setOnCharger: false,
      });

      expect(response.json().success).toBe(false);
      expect(sendCall).not.toHaveBeenCalled();
      expect(provisionVariableAttributes).not.toHaveBeenCalled();
    });

    it('refuses a station that has never connected', async () => {
      readChargingStationByStationId.mockResolvedValue(undefined);

      const response = await post({
        ocppConnectionName: 'cs001',
        password: A_VALID_PASSWORD,
        setOnCharger: false,
      });

      expect(response.json().success).toBe(false);
      expect(sendCall).not.toHaveBeenCalled();
    });
  });

  describe('validation', () => {
    it('rejects a password that does not meet the complexity rules', async () => {
      const response = await post({
        ocppConnectionName: 'cs001',
        password: 'short',
        setOnCharger: false,
      });

      expect(response.statusCode).toBe(400);
      expect(sendCall).not.toHaveBeenCalled();
    });

    it('rejects a body without a station name', async () => {
      const response = await post({ password: A_VALID_PASSWORD, setOnCharger: false });

      expect(response.statusCode).toBe(400);
      expect(sendCall).not.toHaveBeenCalled();
    });
  });

  describe('station round trip', () => {
    it('correlates the send with the cached response', async () => {
      await post({
        ocppConnectionName: 'cs001',
        password: A_VALID_PASSWORD,
        setOnCharger: false,
      });

      const correlationId = sendCall.mock.calls[0][0].correlationId;
      expect(correlationId).toEqual(expect.any(String));
      expect(onChange).toHaveBeenCalledWith(correlationId, expect.any(Number), 'cs001');
    });

    it('reports failure when the send was not accepted', async () => {
      sendCall.mockResolvedValue({ success: false, payload: 'offline' });

      const response = await post({
        ocppConnectionName: 'cs001',
        password: A_VALID_PASSWORD,
        setOnCharger: false,
      });

      expect(response.json()).toEqual({
        success: false,
        payload: 'Failed updating password on cs001 station',
      });
      expect(provisionVariableAttributes).not.toHaveBeenCalled();
    });

    it('reports failure when the station never responds', async () => {
      onChange.mockResolvedValue(null);

      const response = await post({
        ocppConnectionName: 'cs001',
        password: A_VALID_PASSWORD,
        setOnCharger: false,
      });

      expect(response.json().success).toBe(false);
      expect(provisionVariableAttributes).not.toHaveBeenCalled();
    });

    it('reports failure when the station rejects the variable', async () => {
      onChange.mockResolvedValue(
        JSON.stringify({
          setVariableResult: [{ attributeStatus: OCPP2_0_1.SetVariableStatusEnumType.Rejected }],
        }),
      );

      const response = await post({
        ocppConnectionName: 'cs001',
        password: A_VALID_PASSWORD,
        setOnCharger: false,
      });

      expect(response.json().success).toBe(false);
      expect(provisionVariableAttributes).not.toHaveBeenCalled();
    });
  });

  it('persists the password as a write-only attribute and reports how many rows changed', async () => {
    const response = await post({
      ocppConnectionName: 'cs001',
      password: A_VALID_PASSWORD,
      setOnCharger: true,
    });

    expect(response.json()).toEqual({ success: true, payload: 'Updated 1 attributes' });
    const [, , reportData, setOnCharger] = provisionVariableAttributes.mock.calls[0];
    expect(reportData.variableAttribute[0]).toMatchObject({
      value: A_VALID_PASSWORD,
      mutability: OCPP2_0_1.MutabilityEnumType.WriteOnly,
    });
    expect(setOnCharger).toBe(true);
  });
});
