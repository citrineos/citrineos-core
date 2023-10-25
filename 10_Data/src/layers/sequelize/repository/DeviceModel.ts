/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Copyright (c) 2023 S44, LLC
 */

import { AttributeEnumType, ChargingStationType, ComponentType, MutabilityEnumType, ReportDataType, SetVariableDataType, SetVariableResultType, SetVariableStatusEnumType, VariableType } from "@citrineos/base";
import { VariableAttributeQuerystring } from "../../../interfaces/queries/VariableAttribute";
import { SequelizeRepository } from "./Base";
import { IDeviceModelRepository } from "../../../interfaces";
import { Model, Op } from "sequelize";
import { VariableAttribute, Component, Evse, Variable, VariableCharacteristics } from "../model/DeviceModel";

// TODO: Document this

export class DeviceModelRepository extends SequelizeRepository<VariableAttribute> implements IDeviceModelRepository {

    createOrUpdateDeviceModelByStationId(value: ReportDataType, stationId: string): Promise<VariableAttribute[]> {
        const component: ComponentType = value.component;
        const variable: VariableType = value.variable;
        return this.s.models[Component.MODEL_NAME].findOne({
            where: { name: component.name, instance: component.instance ? component.instance : null },
            include: component.evse ? [{ model: Evse, where: { id: component.evse.id, connectorId: component.evse.connectorId ? component.evse.connectorId : null } }] : []
        })
            .then(savedComponent => {
                if (!savedComponent) {
                    // Create component if not exists
                    return Component.build({
                        ...component
                    }, { include: [Evse] }).save();
                } else {
                    return savedComponent;
                }
            }).then(componentModel => {
                return this.s.models[Variable.MODEL_NAME].findOne({
                    where: { name: variable.name, instance: variable.instance ? variable.instance : null },
                    include: [{ model: Component, where: { id: componentModel.get('id') } }]
                }).then(async savedVariable => {
                    if (!savedVariable) {
                        // Create variable if not exists
                        return [componentModel, await Variable.build({
                            componentId: componentModel.get('id'),
                            ...variable
                        }).save()];
                    } else {
                        return [componentModel, savedVariable];
                    }
                });
            }).then(async componentVariableTuple => {
                const componentModel: Model = componentVariableTuple[0] as Model;
                const variableModel: Model = componentVariableTuple[1] as Model;
                if (value.variableCharacteristics) {
                    const variableCharacteristicsModel = VariableCharacteristics.build({
                        ...value.variableCharacteristics
                    });
                    this.s.models[VariableCharacteristics.MODEL_NAME].findOne({
                        where: {},
                        include: [{ model: Variable, where: { id: variableModel.get('id') } }]
                    })
                        .then(savedVariableCharacteristics => {
                            // Create or update variable characteristics
                            if (savedVariableCharacteristics) {
                                for (const k in variableCharacteristicsModel.dataValues) {
                                    savedVariableCharacteristics.setDataValue(k, variableCharacteristicsModel.getDataValue(k));
                                }
                                savedVariableCharacteristics.save();
                            } else {
                                variableCharacteristicsModel.save()
                            }
                        });
                }
                const savedVariableAttributes: VariableAttribute[] = [];
                const evseSerialId = componentModel.get('evseSerialId');
                for (const variableAttribute of value.variableAttribute) {
                    const variableAttributeModel = VariableAttribute.build({
                        stationId: stationId,
                        variableId: variableModel.get('id'),
                        componentId: componentModel.get('id'),
                        evseSerialId: evseSerialId,
                        ...variableAttribute
                    }, {
                        include: [{ model: Variable, include: [VariableCharacteristics] },
                        { model: Component, include: [Evse] }]
                    });
                    await super.readByQuery({
                        where: { stationId: stationId, type: variableAttribute.type ? variableAttribute.type : AttributeEnumType.Actual },
                        include: [{ model: Variable, where: { id: variableModel.get('id') } },
                        { model: Component, where: { id: componentModel.get('id') }, include: evseSerialId ? [{ model: Evse, where: { serialId: evseSerialId } }] : [] }]
                    }, VariableAttribute.MODEL_NAME).then(savedVariableAttribute => {
                        // Create or update variable attribute
                        if (savedVariableAttribute) {
                            for (const k in variableAttributeModel.dataValues) {
                                savedVariableAttribute.setDataValue(k, variableAttributeModel.getDataValue(k));
                            }
                            return savedVariableAttribute.save();
                        } else {
                            return variableAttributeModel.save()
                        }
                    }).then(savedVariableAttribute => savedVariableAttributes.push(savedVariableAttribute));
                }
                return savedVariableAttributes;
            });
    }

    updateResultByStationId(result: SetVariableResultType, stationId: string): Promise<VariableAttribute | undefined> {
        return super.readByQuery({
            where: { stationId: stationId, type: result.attributeType ? result.attributeType : AttributeEnumType.Actual },
            include: [
                {
                    model: Component, where: { name: result.component.name, instance: result.component.instance ? result.component.instance : null },
                    include: result.component.evse ? [{ model: Evse, where: { id: result.component.evse.id, connectorId: result.component.evse.connectorId ? result.component.evse.connectorId : null } }] : []
                },
                { model: Variable, where: { name: result.variable.name, instance: result.variable.instance ? result.variable.instance : null } }]
        }, VariableAttribute.MODEL_NAME).then(savedVariableAttribute => {
            if (savedVariableAttribute) {
                // Update result fields
                savedVariableAttribute.status = result.attributeStatus;
                savedVariableAttribute.statusInfo = result.attributeStatusInfo;
                return savedVariableAttribute.save();
            } else {
                // Do nothing
            }
        });
    }

    async updateBootAttributes(chargingStation: ChargingStationType, stationId: string) {
        await this.createOrUpdateDeviceModelByStationId({
            component: {
                name: "ChargingStation"
            },
            variable: {
                name: "SerialNumber"
            },
            variableAttribute: [
                {
                    type: AttributeEnumType.Actual,
                    value: chargingStation.serialNumber,
                    mutability: MutabilityEnumType.ReadOnly,
                    persistent: true,
                    constant: true
                }
            ]
        }, stationId);
        await this.createOrUpdateDeviceModelByStationId({
            component: {
                name: "ChargingStation"
            },
            variable: {
                name: "Model"
            },
            variableAttribute: [
                {
                    type: AttributeEnumType.Actual,
                    value: chargingStation.model,
                    mutability: MutabilityEnumType.ReadOnly,
                    persistent: true,
                    constant: true
                }
            ]
        }, stationId);
        await this.createOrUpdateDeviceModelByStationId({
            component: {
                name: "ChargingStation"
            },
            variable: {
                name: "VendorName"
            },
            variableAttribute: [
                {
                    type: AttributeEnumType.Actual,
                    value: chargingStation.vendorName,
                    mutability: MutabilityEnumType.ReadOnly,
                    persistent: true,
                    constant: true
                }
            ]
        }, stationId);
        await this.createOrUpdateDeviceModelByStationId({
            component: {
                name: "Controller"
            },
            variable: {
                name: "FirmwareVersion"
            },
            variableAttribute: [
                {
                    type: AttributeEnumType.Actual,
                    value: chargingStation.firmwareVersion,
                    mutability: MutabilityEnumType.ReadOnly,
                    persistent: true,
                    constant: true
                }
            ]
        }, stationId);
        await this.createOrUpdateDeviceModelByStationId({
            component: {
                name: "DataLink"
            },
            variable: {
                name: "IMSI"
            },
            variableAttribute: [
                {
                    type: AttributeEnumType.Actual,
                    value: chargingStation.modem?.imsi,
                    mutability: MutabilityEnumType.ReadOnly,
                    persistent: true,
                    constant: true
                }
            ]
        }, stationId);
        await this.createOrUpdateDeviceModelByStationId({
            component: {
                name: "DataLink"
            },
            variable: {
                name: "ICCID"
            },
            variableAttribute: [
                {
                    type: AttributeEnumType.Actual,
                    value: chargingStation.modem?.iccid,
                    mutability: MutabilityEnumType.ReadOnly,
                    persistent: true,
                    constant: true
                }
            ]
        }, stationId);
    }

    readAllSetVariableByStationId(stationId: string): Promise<SetVariableDataType[]> {
        return super.readAllByQuery({
            where: {
                stationId: stationId, bootConfigSetId: { [Op.ne]: null }
            },
            include: [{ model: Component, include: [Evse] }, Variable]
        }, VariableAttribute.MODEL_NAME)
            .then(variableAttributeArray => {
                const setVariableDataTypeArray: SetVariableDataType[] = [];
                for (const variableAttribute of variableAttributeArray) {
                    setVariableDataTypeArray.push(this.createSetVariableDataType(variableAttribute));
                }
                return setVariableDataTypeArray;
            });
    }

    readAllByQuery(query: VariableAttributeQuerystring): Promise<VariableAttribute[]> {
        return super.readAllByQuery(this.constructQuery(query), VariableAttribute.MODEL_NAME);
    }

    existsRejectedSetVariableByStationId(stationId: string): Promise<boolean> {
        return super.readAllByQuery({
            where: {
                stationId: stationId, bootConfigSetId: { [Op.ne]: null }
            }
        }, VariableAttribute.MODEL_NAME)
            .then(variableAttributeArray => {
               return variableAttributeArray.some(variableAttribute => variableAttribute.status === SetVariableStatusEnumType.Rejected); 
            });
    }

    existsByQuery(query: VariableAttributeQuerystring): Promise<boolean> {
        return super.existsByQuery(this.constructQuery(query), VariableAttribute.MODEL_NAME);
    }

    deleteAllByQuery(query: VariableAttributeQuerystring): Promise<number> {
        return super.deleteAllByQuery(this.constructQuery(query), VariableAttribute.MODEL_NAME);
    }

    /**
     * Private Methods
     */

    private createSetVariableDataType(input: VariableAttribute): SetVariableDataType {
        if (!input.value) {
            throw new Error("Value must be present to generate SetVariableDataType from VariableAttribute");
        } else {
            return {
                attributeType: input.type,
                attributeValue: input.value,
                component: {
                    name: input.component.name,
                    instance: input.component.instance,
                    evse: input.component.evse ? {
                        id: input.component.evse.id,
                        connectorId: input.component.evse.connectorId
                    } : undefined
                },
                variable: {
                    name: input.variable.name,
                    instance: input.variable.instance
                }
            };
        }
    }

    private constructQuery(queryParams: VariableAttributeQuerystring): object {
        const evseInclude = (queryParams.component_evse_id || queryParams.component_evse_connectorId) ?
            {
                model: Evse,
                where: {
                    ...(queryParams.component_evse_id ? { id: queryParams.component_evse_id } : {}),
                    ...(queryParams.component_evse_connectorId ? { connectorId: queryParams.component_evse_connectorId } : {})
                }
            } :
            Evse;
        return {
            where: {
                ...(queryParams.stationId ? { stationId: queryParams.stationId } : {}),
                ...(queryParams.type ? { type: queryParams.type } : {}),
                ...(queryParams.value ? { value: queryParams.value } : {}),
                ...(queryParams.status ? { status: queryParams.status } : {})
            },
            include: [
                {
                    model: Component,
                    where: {
                        ...(queryParams.component_name ? { name: queryParams.component_name } : {}),
                        ...(queryParams.component_instance ? { instance: queryParams.component_instance } : {})
                    },
                    include: [evseInclude]
                },
                {
                    model: Variable,
                    where: {
                        ...(queryParams.variable_name ? { name: queryParams.variable_name } : {}),
                        ...(queryParams.variable_instance ? { instance: queryParams.variable_instance } : {})
                    },
                    include: [VariableCharacteristics]
                }
            ]
        }
    }
}