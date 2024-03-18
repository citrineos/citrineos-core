// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {IDeviceModelRepository} from "@citrineos/data";
import {AttributeEnumType} from "@citrineos/base";
import {VariableAttribute} from "@citrineos/data/lib/layers/sequelize";

export class DeviceModelService {
    protected _deviceModelRepository: IDeviceModelRepository;

    constructor(deviceModelRepository: IDeviceModelRepository) {
        this._deviceModelRepository = deviceModelRepository;
    }

    /**
     * Fetches the ItemsPerMessage attribute from the device model.
     * Returns null if no such attribute exists.
     * @param stationId Charging station identifier.
     * @returns ItemsPerMessage as a number or null if no such attribute exists.
     */
    async getItemsPerMessageByComponentAndVariableInstanceAndStationId(componentName: string, variableInstance: string, stationId: string): Promise<number | null> {
        const itemsPerMessageAttributes: VariableAttribute[] = await this._deviceModelRepository.readAllByQuery({
            stationId: stationId,
            component_name: componentName,
            variable_name: 'ItemsPerMessage',
            variable_instance: variableInstance,
            type: AttributeEnumType.Actual
        });
        if (itemsPerMessageAttributes.length == 0) {
            return null;
        } else {
            // It is possible for itemsPerMessageAttributes.length > 1 if component instances or evses
            // are associated with alternate options. That structure is not supported by this logic, and that
            // structure is a violation of Part 2 - Specification of OCPP 2.0.1.
            return Number(itemsPerMessageAttributes[0].value);
        }
    }
}