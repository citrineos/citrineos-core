// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP2_0_1 } from '@citrineos/base';
import type { IDeviceModelRepository } from '@dal/interfaces/repositories.js';
import { VariableAttribute } from '@dal/layers/sequelize/index.js';

export class DeviceModelService {
  protected _deviceModelRepository: IDeviceModelRepository;

  constructor({ deviceModelRepository }: { deviceModelRepository: IDeviceModelRepository }) {
    this._deviceModelRepository = deviceModelRepository;
  }

  /**
   * Fetches the ItemsPerMessage attribute from the device model.
   * Returns null if no such attribute exists.
   * It is possible for there to be multiple ItemsPerMessage attributes if component instances or evses
   * are associated with alternate options. That structure is not supported by this logic, and that
   * structure is a violation of Part 2 - Specification of OCPP 2.0.1.
   * In that case, the first attribute will be returned.
   * @param ocppConnectionName - The connection name of the charging station
   * @returns ItemsPerMessage as a number or null if no such attribute exists.
   */
  async getItemsPerMessageByComponentAndVariableInstanceAndStationId(
    componentName: string,
    variableInstance: string,
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<number | null> {
    const itemsPerMessageAttributes: VariableAttribute[] =
      await this._deviceModelRepository.readAllByQuerystring(tenantId, {
        tenantId: tenantId,
        ocppConnectionName: ocppConnectionName,
        component_name: componentName,
        variable_name: 'ItemsPerMessage',
        variable_instance: variableInstance,
        type: OCPP2_0_1.AttributeEnumType.Actual,
      });
    if (itemsPerMessageAttributes.length === 0) {
      return null;
    } else {
      // It is possible for itemsPerMessageAttributes.length > 1 if component instances or evses
      // are associated with alternate options. That structure is not supported by this logic, and that
      // structure is a violation of Part 2 - Specification of OCPP 2.0.1.
      return Number(itemsPerMessageAttributes[0].value);
    }
  }

  /**
   * Fetches the BytesPerMessage attribute from the device model.
   * Returns null if no such attribute exists.
   * It is possible for there to be multiple BytesPerMessage attributes if component instances or evses
   * are associated with alternate options. That structure is not supported by this logic, and that
   * structure is a violation of Part 2 - Specification of OCPP 2.0.1.
   * In that case, the first attribute will be returned.
   * @param ocppConnectionName - The connection name of the charging station
   * @returns BytesPerMessage as a number or null if no such attribute exists.
   */
  async getBytesPerMessageByComponentAndVariableInstanceAndStationId(
    componentName: string,
    variableInstance: string,
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<number | null> {
    const bytesPerMessageAttributes: VariableAttribute[] =
      await this._deviceModelRepository.readAllByQuerystring(tenantId, {
        tenantId: tenantId,
        ocppConnectionName: ocppConnectionName,
        component_name: componentName,
        variable_name: 'BytesPerMessage',
        variable_instance: variableInstance,
        type: OCPP2_0_1.AttributeEnumType.Actual,
      });
    if (bytesPerMessageAttributes.length === 0) {
      return null;
    } else {
      // It is possible for bytesPerMessageAttributes.length > 1 if component instances or evses
      // are associated with alternate options. That structure is not supported by this logic, and that
      // structure is a violation of Part 2 - Specification of OCPP 2.0.1.
      return Number(bytesPerMessageAttributes[0].value);
    }
  }
}
