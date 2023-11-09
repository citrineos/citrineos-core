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

import { AttributeEnumType, ComponentType, GetVariableResultType, ReportDataType, SetVariableDataType, SetVariableResultType, SetVariableStatusEnumType, StatusInfoType, VariableType } from "@citrineos/base";
import { VariableAttributeQuerystring } from "../../../interfaces/queries/VariableAttribute";
import { SequelizeRepository } from "./Base";
import { IDeviceModelRepository } from "../../../interfaces";
import { Model, Op } from "sequelize";
import { VariableAttribute, Component, Evse, Variable, VariableCharacteristics } from "../model/DeviceModel";
import { VariableStatus } from "../model/DeviceModel/VariableStatus";

// TODO: Document this

export class DeviceModelRepository extends SequelizeRepository<VariableAttribute> implements IDeviceModelRepository {

    createOrUpdateDeviceModelByStationId(value: ReportDataType, stationId: string): Promise<VariableAttribute[]> {
        const component: ComponentType = value.component;
        const variable: VariableType = value.variable;
        console.log("Called... " + value.variableAttribute);
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
                        id: undefined, // Prevents update from removing id
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
                                console.log("Updating " + k + " from " + savedVariableAttribute.getDataValue(k) + " to " + variableAttributeModel.getDataValue(k));
                                const updatedValue = variableAttributeModel.getDataValue(k);
                                if (updatedValue != undefined) { // Null can still be used to remove data
                                    savedVariableAttribute.setDataValue(k, variableAttributeModel.getDataValue(k));
                                }
                            }
                            console.log("Saving updated " + savedVariableAttribute.value);
                            return savedVariableAttribute.save();
                        } else {
                            console.log("Saving " + variableAttributeModel.value);
                            return variableAttributeModel.save()
                        }
                    }).then(savedVariableAttribute => savedVariableAttributes.push(savedVariableAttribute));
                }
                return savedVariableAttributes;
            });
    }

    async createOrUpdateByGetVariablesResultAndStationId(getVariablesResult: GetVariableResultType[], stationId: string): Promise<VariableAttribute[]> {
        let savedVariableAttributes: VariableAttribute[] = [];
        for (const result of getVariablesResult) {
            const savedVariableAttribute = (await this.createOrUpdateDeviceModelByStationId({
                component: {
                    name: result.component.name,
                    instance: result.component.instance,
                    ...(result.component.evse ? {
                        evse: {
                            id: result.component.evse.id,
                            connectorId: result.component.evse.connectorId
                        }
                    } : {})
                },
                variable: {
                    name: result.variable.name,
                    instance: result.variable.instance
                },
                variableAttribute: [
                    {
                        type: result.attributeType,
                        value: result.attributeValue
                    }
                ]
            }, stationId))[0];
            VariableStatus.build({
                value: result.attributeValue,
                status: result.attributeStatus,
                statusInfo: result.attributeStatusInfo,
                variableAttributeId: savedVariableAttribute.get('id')
            }, { include: [VariableAttribute] }).save();
            savedVariableAttributes = await savedVariableAttributes.concat(savedVariableAttribute);
        }
        return savedVariableAttributes;
    }

    async createOrUpdateBySetVariablesDataAndStationId(setVariablesData: SetVariableDataType[], stationId: string): Promise<VariableAttribute[]> {
        let savedVariableAttributes: VariableAttribute[] = [];
        for (const data of setVariablesData) {
            savedVariableAttributes = await savedVariableAttributes.concat(await this.createOrUpdateDeviceModelByStationId({
                component: {
                    name: data.component.name,
                    instance: data.component.instance,
                    ...(data.component.evse ? {
                        evse: {
                            id: data.component.evse.id,
                            connectorId: data.component.evse.connectorId
                        }
                    } : {})
                },
                variable: {
                    name: data.variable.name,
                    instance: data.variable.instance
                },
                variableAttribute: [
                    {
                        type: data.attributeType,
                        value: data.attributeValue
                    }
                ]
            }, stationId));
        }
        console.log("Created " + savedVariableAttributes.length + " variable attributes");
        savedVariableAttributes.forEach(savedVariableAttribute => {
            console.log("Saved " + savedVariableAttribute.value);
        })
        return savedVariableAttributes;
    }

    updateResultByStationId(result: SetVariableResultType, stationId: string): Promise<VariableAttribute | undefined> {
        return super.readByQuery({
            where: { stationId: stationId, type: result.attributeType ? result.attributeType : AttributeEnumType.Actual },
            include: [ { model: VariableStatus, where: { status: "Accepted" } },
                {
                    model: Component, where: { name: result.component.name, instance: result.component.instance ? result.component.instance : null },
                    include: result.component.evse ? [{ model: Evse, where: { id: result.component.evse.id, connectorId: result.component.evse.connectorId ? result.component.evse.connectorId : null } }] : []
                },
                { model: Variable, where: { name: result.variable.name, instance: result.variable.instance ? result.variable.instance : null } }],
            order: [[VariableStatus, 'createdAt', 'DESC']]
        }, VariableAttribute.MODEL_NAME).then(savedVariableAttribute => {
            if (savedVariableAttribute) {
                VariableStatus.build({
                    value: savedVariableAttribute.value,
                    status: result.attributeStatus,
                    statusInfo: result.attributeStatusInfo,
                    variableAttributeId: savedVariableAttribute.get('id')
                }, { include: [VariableAttribute] }).save();

                if (result.attributeStatus === SetVariableStatusEnumType.Rejected) {
                    // Roll back variable attribute to last Accepted value, if any
                    const oldVariableStatus = savedVariableAttribute.statuses?.pop();
                    if (oldVariableStatus) {
                        savedVariableAttribute.value = oldVariableStatus.value;
                        return savedVariableAttribute.save();
                    }
                }
                return savedVariableAttribute;
            } else {
                throw new Error("Unable to update variable attribute...");
            }
        });
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
        const readQuery = this.constructQuery(query);
        readQuery.include.push(VariableStatus);
        return super.readAllByQuery(readQuery, VariableAttribute.MODEL_NAME);
    }

    existsRejectedSetVariableByStationId(stationId: string): Promise<boolean> {
        return super.readAllByQuery({
            where: {
                stationId: stationId, bootConfigSetId: { [Op.ne]: null }
            },
            include: [VariableStatus],
            order: [[VariableStatus, 'createdAt', 'DESC']]
        }, VariableAttribute.MODEL_NAME)
            .then(variableAttributeArray => {
                return variableAttributeArray.some(variableAttribute => variableAttribute.statuses?.pop()?.status === SetVariableStatusEnumType.Rejected);
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

    private constructQuery(queryParams: VariableAttributeQuerystring): any {
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