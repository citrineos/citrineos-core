// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_TENANT_ID } from '@citrineos/base';
import {
  AttributeEnum,
  MutabilityEnum,
  OCPP2_0_1,
  type OCPP2_common_types,
  SetVariableStatusEnum,
} from '@citrineos/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeviceModelService } from '@util/deviceModel/DeviceModelService.js';
import { createTestContainer, getTestInstance } from '@test/testContainer.js';

describe('DeviceModelService.provisionVariableAttributes', () => {
  const { container } = createTestContainer();
  const tenantId = DEFAULT_TENANT_ID;
  const ocppConnectionName = 'Station01';

  function aReportData(
    variableAttribute: OCPP2_common_types.ReportDataType['variableAttribute'],
  ): OCPP2_common_types.ReportDataType {
    return {
      component: { name: 'SecurityCtrlr' },
      variable: { name: 'BasicAuthPassword' },
      variableAttribute,
    };
  }

  function aPersistedAttribute() {
    const attribute = {
      type: AttributeEnum.Actual,
      component: { name: 'SecurityCtrlr' },
      variable: { name: 'BasicAuthPassword' },
      reload: vi.fn(),
    };
    attribute.reload.mockResolvedValue(attribute);
    return attribute;
  }

  let createOrUpdateDeviceModelByStationId: ReturnType<typeof vi.fn>;
  let updateResultByStationId: ReturnType<typeof vi.fn>;
  let service: DeviceModelService;

  beforeEach(() => {
    vi.clearAllMocks();
    createOrUpdateDeviceModelByStationId = vi.fn().mockResolvedValue([aPersistedAttribute()]);
    updateResultByStationId = vi.fn().mockResolvedValue(undefined);

    service = getTestInstance(container, DeviceModelService, {
      deviceModelRepository: {
        createOrUpdateDeviceModelByStationId,
        updateResultByStationId,
      },
    });
  });

  it('persists the device model without recording acceptance by default', async () => {
    await service.provisionVariableAttributes(
      tenantId,
      ocppConnectionName,
      aReportData([
        { type: AttributeEnum.Actual, value: 'a-value' },
      ] as OCPP2_common_types.ReportDataType['variableAttribute']),
      false,
    );

    expect(createOrUpdateDeviceModelByStationId).toHaveBeenCalledTimes(1);
    expect(updateResultByStationId).not.toHaveBeenCalled();
  });

  it('records acceptance for each attribute when the value is already set on the charger', async () => {
    await service.provisionVariableAttributes(
      tenantId,
      ocppConnectionName,
      aReportData([
        { type: AttributeEnum.Actual, value: 'a-value' },
      ] as OCPP2_common_types.ReportDataType['variableAttribute']),
      true,
    );

    expect(updateResultByStationId).toHaveBeenCalledTimes(1);
    const [, result] = updateResultByStationId.mock.calls[0];
    expect(result).toMatchObject({
      attributeStatus: SetVariableStatusEnum.Accepted,
      attributeStatusInfo: { reasonCode: 'SetOnCharger' },
    });
  });

  it('defaults mutability to ReadWrite when the caller omits it', async () => {
    await service.provisionVariableAttributes(
      tenantId,
      ocppConnectionName,
      aReportData([
        { type: AttributeEnum.Actual, value: 'a-value' },
      ] as OCPP2_common_types.ReportDataType['variableAttribute']),
      false,
    );

    const [, reportData] = createOrUpdateDeviceModelByStationId.mock.calls[0];
    expect(reportData.variableAttribute[0].mutability).toBe(MutabilityEnum.ReadWrite);
  });

  it('preserves an explicit mutability so write-only values are not made readable', async () => {
    await service.provisionVariableAttributes(
      tenantId,
      ocppConnectionName,
      aReportData([
        {
          type: OCPP2_0_1.AttributeEnumType.Actual,
          value: 'a-password',
          mutability: OCPP2_0_1.MutabilityEnumType.WriteOnly,
        },
      ]),
      true,
    );

    const [, reportData] = createOrUpdateDeviceModelByStationId.mock.calls[0];
    expect(reportData.variableAttribute[0].mutability).toBe(MutabilityEnum.WriteOnly);
  });

  it('does not mutate the caller-supplied report data', async () => {
    const reportData = aReportData([
      { type: OCPP2_0_1.AttributeEnumType.Actual, value: 'a-value' },
    ]);

    await service.provisionVariableAttributes(tenantId, ocppConnectionName, reportData, false);

    expect(reportData.variableAttribute[0].mutability).toBeUndefined();
  });
});
