// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { AttributeEnumType } from "@citrineos/base";
import {IDeviceModelRepository, VariableAttributeQuerystring} from "@citrineos/data";
import { VariableAttribute } from "@citrineos/data/lib/layers/sequelize";

export class DeviceModelService {

    protected _deviceModelRepository: IDeviceModelRepository;

    constructor(
        deviceModelRepository: IDeviceModelRepository) {
        this._deviceModelRepository = deviceModelRepository;
    }

    /**
     * Fetches the Available attribute from the device model.
     * Returns null if no such attribute exists.
     * @param stationId Charging station identifier.
     * @returns Available as a boolean or null if no such attribute exists.
     */
    async getAvailableByComponentAndVariableInstanceAndStationId(componentName: string, variableInstance: string | null, stationId: string): Promise<boolean | null> {
        const query: VariableAttributeQuerystring = {
            stationId: stationId,
            component_name: componentName,
            variable_name: 'Available',
            type: AttributeEnumType.Actual
        }
        if (variableInstance) {
            query.variable_instance = variableInstance;
        }

        const availableAttributes: VariableAttribute[] = await this._deviceModelRepository.readAllByQuery(query);
        if (availableAttributes.length == 0) {
            return null;
        } else {
            return Boolean(availableAttributes[0].value);
        }
    }
}