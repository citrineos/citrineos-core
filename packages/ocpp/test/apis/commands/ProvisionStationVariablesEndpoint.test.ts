// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { OCPP2_0_1 } from '@citrineos/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProvisionStationVariablesEndpoint } from '@/apis/commands/ProvisionStationVariablesEndpoint.js';
import { createTestContainer, getTestInstance } from '@test/testContainer.js';
import { mountEndpoint, type MountedEndpoint } from '@test/providers/endpointHarness.js';

const URL = '/commands/provisionStationVariables';
const STATION = 'cs001';

function aReportDataBody() {
  return {
    component: { name: 'SecurityCtrlr' },
    variable: { name: 'BasicAuthPassword' },
    variableAttribute: [{ type: OCPP2_0_1.AttributeEnumType.Actual, value: 'a-value' }],
  };
}

describe('ProvisionStationVariablesEndpoint', () => {
  const { container } = createTestContainer();

  let provisionVariableAttributes: ReturnType<typeof vi.fn>;
  let mounted: MountedEndpoint;

  beforeEach(async () => {
    vi.clearAllMocks();
    provisionVariableAttributes = vi.fn().mockResolvedValue([{}, {}]);

    const endpoint = getTestInstance(container, ProvisionStationVariablesEndpoint, {
      deviceModelService: { provisionVariableAttributes },
    });
    mounted = await mountEndpoint(endpoint, ProvisionStationVariablesEndpoint.route);
  });

  const post = (query: string, body: unknown) =>
    mounted.server.inject({ method: 'PUT', url: `${URL}?${query}`, payload: body });

  it('provisions without recording acceptance when the flag is absent', async () => {
    const response = await post(
      `tenantId=${DEFAULT_TENANT_ID}&ocppConnectionName=${STATION}`,
      aReportDataBody(),
    );

    expect(response.json()).toEqual({ success: true, payload: 'Updated 2 attributes' });
    const [tenantId, ocppConnectionName, , setOnCharger] =
      provisionVariableAttributes.mock.calls[0];
    expect(tenantId).toBe(DEFAULT_TENANT_ID);
    expect(ocppConnectionName).toBe(STATION);
    expect(setOnCharger).toBe(false);
  });

  it('records acceptance when the value is already set on the charger', async () => {
    await post(
      `tenantId=${DEFAULT_TENANT_ID}&ocppConnectionName=${STATION}&setOnCharger=true`,
      aReportDataBody(),
    );

    const [, , , setOnCharger] = provisionVariableAttributes.mock.calls[0];
    expect(setOnCharger).toBe(true);
  });

  it('forwards the report data unchanged', async () => {
    const body = aReportDataBody();
    await post(`tenantId=${DEFAULT_TENANT_ID}&ocppConnectionName=${STATION}`, body);

    const [, , reportData] = provisionVariableAttributes.mock.calls[0];
    expect(reportData).toMatchObject(body);
  });

  it('rejects a request without a station name', async () => {
    const response = await post(`tenantId=${DEFAULT_TENANT_ID}`, aReportDataBody());

    expect(response.statusCode).toBe(400);
    expect(provisionVariableAttributes).not.toHaveBeenCalled();
  });

  it('rejects a body that is not report data', async () => {
    const response = await post(`tenantId=${DEFAULT_TENANT_ID}&ocppConnectionName=${STATION}`, {
      component: { name: 'SecurityCtrlr' },
    });

    expect(response.statusCode).toBe(400);
    expect(provisionVariableAttributes).not.toHaveBeenCalled();
  });
});
