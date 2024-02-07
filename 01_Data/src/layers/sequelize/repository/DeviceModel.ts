// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { AttributeEnumType, ComponentType, DataEnumType, GetVariableResultType, MutabilityEnumType, ReportDataType, SetVariableDataType, SetVariableResultType, VariableType } from "@citrineos/base";
import { VariableAttributeQuerystring } from "../../../interfaces/queries/VariableAttribute";
import { SequelizeRepository } from "./Base";
import { IDeviceModelRepository } from "../../../interfaces";
import { Op } from "sequelize";
import { VariableAttribute, Component, Evse, Variable, VariableCharacteristics } from "../model/DeviceModel";
import { VariableStatus } from "../model/DeviceModel/VariableStatus";
import { ComponentVariable } from "../model/DeviceModel/ComponentVariable";

// TODO: Document this

export class DeviceModelRepository extends SequelizeRepository<VariableAttribute> implements IDeviceModelRepository {

    async createOrUpdateDeviceModelByStationId(value: ReportDataType, stationId: string): Promise<VariableAttribute[]> {
        // Doing this here so that no records are created if the data is invalid
        const variablAttributeTypes = value.variableAttribute.map(attr => attr.type ? attr.type : AttributeEnumType.Actual)
        if (variablAttributeTypes.length != (new Set(variablAttributeTypes)).size) {
            throw new Error("All variable attributes in ReportData must have different types.");
        }

        const [component, variable] = await this.findOrCreateEvseAndComponentAndVariable(value.component, value.variable, stationId);

        let dataType: DataEnumType | null = null;
        if (value.variableCharacteristics) {
            const [variableCharacteristics, variableCharacteristicsCreated] = await VariableCharacteristics.upsert({
                ...value.variableCharacteristics,
                variable: variable,
                variableId: variable.id
            });
            dataType = variableCharacteristics.dataType;
        }

        return await Promise.all(value.variableAttribute.map(async variableAttribute => {
            // Even though defaults are set on the VariableAttribute model, those only apply when creating an object
            // So we need to set them here to ensure they are set correctly when updating
            const [savedVariableAttribute, variableAttributeCreated] = await VariableAttribute.upsert({
                stationId: stationId,
                variableId: variable.id,
                componentId: component.id,
                evseDatabaseId: component.evseDatabaseId,
                type: variableAttribute.type ? variableAttribute.type : AttributeEnumType.Actual,
                dataType: dataType,
                value: variableAttribute.value,
                mutability: variableAttribute.mutability ? variableAttribute.mutability : MutabilityEnumType.ReadWrite,
                persistent: variableAttribute.persistent ? variableAttribute.persistent : false,
                constant: variableAttribute.constant ? variableAttribute.constant : false
            });
            return savedVariableAttribute;
        }));
    }
    async findOrCreateEvseAndComponentAndVariable(componentType: ComponentType, variableType: VariableType, stationId: string): Promise<[Component, Variable]> {
        const component = await this.findOrCreateEvseAndComponent(componentType, stationId);

        const [variable, variableCreated] = await Variable.findOrCreate({
            where: { name: variableType.name, instance: variableType.instance ? variableType.instance : null },
            defaults: {
                ...variableType
            }
        });

        // This can happen asynchronously
        ComponentVariable.findOrCreate({
            where: { componentId: component.id, variableId: variable.id }
        })

        return [component, variable]
    }

    async findOrCreateEvseAndComponent(componentType: ComponentType, stationId: string): Promise<Component> {
        const evse = componentType.evse ? (await Evse.findOrCreate({ where: { id: componentType.evse.id, connectorId: componentType.evse.connectorId ? componentType.evse.connectorId : null } }))[0] : undefined;

        const [component, componentCreated] = await Component.findOrCreate({
            where: { name: componentType.name, instance: componentType.instance ? componentType.instance : null },
            defaults: { // Explicit assignment because evse field is a relation and is not able to accept a default value
                name: componentType.name, 
                instance: componentType.instance
            }
        });
        // Note: this permits changing the evse related to the component
        if (component.evseDatabaseId !== evse?.databaseId && evse) {
            await component.update({ evseDatabaseId: evse.databaseId });
        }

        if (componentCreated) {
            // Excerpt from OCPP 2.0.1 Part 1 Architecture & Topology - 4.2 :
            // "When a Charging Station does not report: Present, Available and/or Enabled 
            // the Central System SHALL assume them to be readonly and set to true."
            // These default variables and their attributes are created here if the component is new,
            // and they will be overwritten if they are included in the update
            const defaultComponentVariableNames = ['Present', 'Available', 'Enabled'];
            for (const defaultComponentVariableName of defaultComponentVariableNames) {
                const [defaultComponentVariable, defaultComponentVariableCreated] = await Variable.findOrCreate({ where: { name: defaultComponentVariableName, instance: null } });

                // This can happen asynchronously
                ComponentVariable.findOrCreate({
                    where: { componentId: component.id, variableId: defaultComponentVariable.id }
                })

                await VariableAttribute.create({
                    stationId: stationId,
                    variableId: defaultComponentVariable.id,
                    componentId: component.id,
                    evseDatabaseId: evse?.databaseId,
                    dataType: DataEnumType.boolean,
                    value: 'true',
                    mutability: MutabilityEnumType.ReadOnly
                });
            }
        }

        return component;
    }

    async createOrUpdateByGetVariablesResultAndStationId(getVariablesResult: GetVariableResultType[], stationId: string): Promise<VariableAttribute[]> {
        let savedVariableAttributes: VariableAttribute[] = [];
        for (const result of getVariablesResult) {
            const savedVariableAttribute = (await this.createOrUpdateDeviceModelByStationId({
                component: {
                    ...result.component
                },
                variable: {
                    ...result.variable
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
            savedVariableAttributes.push(savedVariableAttribute);
        }
        return savedVariableAttributes;
    }

    async createOrUpdateBySetVariablesDataAndStationId(setVariablesData: SetVariableDataType[], stationId: string): Promise<VariableAttribute[]> {
        let savedVariableAttributes: VariableAttribute[] = [];
        for (const data of setVariablesData) {
            const savedVariableAttribute = (await this.createOrUpdateDeviceModelByStationId({
                component: {
                    ...data.component
                },
                variable: {
                    ...data.variable
                },
                variableAttribute: [
                    {
                        type: data.attributeType,
                        value: data.attributeValue
                    }
                ]
            }, stationId))[0];
            savedVariableAttributes.push(savedVariableAttribute);
        }
        return savedVariableAttributes;
    }

    async updateResultByStationId(result: SetVariableResultType, stationId: string): Promise<VariableAttribute | undefined> {
        const savedVariableAttribute = await super.readByQuery({
            where: { stationId: stationId, type: result.attributeType ? result.attributeType : AttributeEnumType.Actual },
            include: [{ model: Component, where: { name: result.component.name, instance: result.component.instance ? result.component.instance : null } },
            { model: Variable, where: { name: result.variable.name, instance: result.variable.instance ? result.variable.instance : null } }]
        }, VariableAttribute.MODEL_NAME);
        if (savedVariableAttribute) {
            await VariableStatus.create({
                value: savedVariableAttribute.value,
                status: result.attributeStatus,
                statusInfo: result.attributeStatusInfo,
                variableAttributeId: savedVariableAttribute.get('id')
            });
            // Reload in order to include the statuses
            return savedVariableAttribute.reload({
                include: [VariableStatus]
            });
        } else {
            throw new Error("Unable to update variable attribute status...");
        }

    }

    async readAllSetVariableByStationId(stationId: string): Promise<SetVariableDataType[]> {
        const variableAttributeArray = await super.readAllByQuery({
            where: {
                stationId: stationId, bootConfigSetId: { [Op.ne]: null }
            },
            include: [{ model: Component, include: [Evse] }, Variable]
        }, VariableAttribute.MODEL_NAME);

        return variableAttributeArray.map(variableAttribute => this.createSetVariableDataType(variableAttribute));
    }

    readAllByQuery(query: VariableAttributeQuerystring): Promise<VariableAttribute[]> {
        const readQuery = this.constructQuery(query);
        readQuery.include.push(VariableStatus);
        return super.readAllByQuery(readQuery, VariableAttribute.MODEL_NAME);
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
                    ...input.component
                },
                variable: {
                    ...input.variable
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