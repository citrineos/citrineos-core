// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  CrudRepository,
  OCPP2_0_1,
  SystemConfig,
} from '@citrineos/base';
import { SequelizeRepository } from './Base';
import { type IDeviceModelRepository, type VariableAttributeQuerystring } from '../../../interfaces';
import { Op } from 'sequelize';
import { Component, Evse, Variable, VariableAttribute, VariableCharacteristics, VariableStatus } from '../model/DeviceModel';
import { ComponentVariable } from '../model/DeviceModel/ComponentVariable';
import { Sequelize } from 'sequelize-typescript';
import { ILogObj, Logger } from 'tslog'; // TODO: Document this

// TODO: Document this

export class SequelizeDeviceModelRepository extends SequelizeRepository<VariableAttribute> implements IDeviceModelRepository {
  variable: CrudRepository<Variable>;
  component: CrudRepository<Component>;
  evse: CrudRepository<Evse>;
  variableCharacteristics: CrudRepository<VariableCharacteristics>;
  componentVariable: CrudRepository<ComponentVariable>;
  variableStatus: CrudRepository<VariableStatus>;

  constructor(
    config: SystemConfig,
    logger?: Logger<ILogObj>,
    sequelizeInstance?: Sequelize,
    variable?: CrudRepository<Variable>,
    component?: CrudRepository<Component>,
    evse?: CrudRepository<Evse>,
    componentVariable?: CrudRepository<ComponentVariable>,
    variableCharacteristics?: CrudRepository<VariableCharacteristics>,
    variableStatus?: CrudRepository<VariableStatus>,
  ) {
    super(config, VariableAttribute.MODEL_NAME, logger, sequelizeInstance);
    this.variable = variable ? variable : new SequelizeRepository<Variable>(config, Variable.MODEL_NAME, logger, sequelizeInstance);
    this.component = component ? component : new SequelizeRepository<Component>(config, Component.MODEL_NAME, logger, sequelizeInstance);
    this.evse = evse ? evse : new SequelizeRepository<Evse>(config, Evse.MODEL_NAME, logger, sequelizeInstance);
    this.componentVariable = componentVariable ? componentVariable : new SequelizeRepository<ComponentVariable>(config, ComponentVariable.MODEL_NAME, logger, sequelizeInstance);
    this.variableCharacteristics = variableCharacteristics ? variableCharacteristics : new SequelizeRepository<VariableCharacteristics>(config, VariableCharacteristics.MODEL_NAME, logger, sequelizeInstance);
    this.variableStatus = variableStatus ? variableStatus : new SequelizeRepository<VariableStatus>(config, VariableStatus.MODEL_NAME, logger, sequelizeInstance);
  }

  async createOrUpdateDeviceModelByStationId(value: OCPP2_0_1.ReportDataType, stationId: string, isoTimestamp: string): Promise<VariableAttribute[]> {
    // Doing this here so that no records are created if the data is invalid
    const variableAttributeTypes = value.variableAttribute.map((attr) => attr.type ?? OCPP2_0_1.AttributeEnumType.Actual);
    if (variableAttributeTypes.length !== new Set(variableAttributeTypes).size) {
      throw new Error('All variable attributes in ReportData must have different types.');
    }

    const [component, variable] = await this.findOrCreateEvseAndComponentAndVariable(value.component, value.variable, stationId);

    let dataType: OCPP2_0_1.DataEnumType | null = null;

    if (value.variableCharacteristics) {
      const variableCharacteristicsType = value.variableCharacteristics;
      dataType = variableCharacteristicsType.dataType;
      const vc = {
        unit: variableCharacteristicsType.unit ?? null,
        dataType,
        minLimit: variableCharacteristicsType.minLimit ?? null,
        maxLimit: variableCharacteristicsType.maxLimit ?? null,
        valuesList: variableCharacteristicsType.valuesList ?? null,
        supportsMonitoring: variableCharacteristicsType.supportsMonitoring,
        variableId: variable.id,
      };
      await this.s.transaction(async (transaction) => {
        const savedVariableCharacteristics = await this.s.models[VariableCharacteristics.MODEL_NAME].findOne({
          where: {
            variableId: variable.id,
          },
          transaction,
        });

        if (!savedVariableCharacteristics) {
          const createdVariableCharacteristics = await VariableCharacteristics.create(vc, { transaction });
          this.variableCharacteristics.emit('created', [createdVariableCharacteristics]);
          return createdVariableCharacteristics;
        } else {
          return await this.variableCharacteristics.updateAllByQuery(vc, {
            where: {
              variableId: variable.id,
            },
            transaction,
          });
        }
      });
    }

    return await Promise.all(
      value.variableAttribute.map(async (variableAttribute) => {
        const [savedVariableAttribute, variableAttributeCreated] = await this.readOrCreateByQuery({
          where: {
            // the composite unique index of VariableAttribute
            stationId: stationId,
            variableId: variable.id,
            componentId: component.id,
            type: variableAttribute.type ?? OCPP2_0_1.AttributeEnumType.Actual,
          },
          defaults: {
            // used to define what must be created in case nothing was found. If the defaults do not
            // contain values for every column, Sequelize will take the values given to where (if present).
            evseDatabaseId: component.evseDatabaseId,
            dataType,
            value: variableAttribute.value,
            generatedAt: isoTimestamp,
            mutability: variableAttribute.mutability ?? OCPP2_0_1.MutabilityEnumType.ReadWrite,
            persistent: variableAttribute.persistent ? variableAttribute.persistent : false,
            constant: variableAttribute.constant ? variableAttribute.constant : false,
          },
        });
        if (!variableAttributeCreated) {
          return (await this.updateByKey(
            {
              evseDatabaseId: component.evseDatabaseId,
              dataType: dataType ?? savedVariableAttribute.dataType,
              type: variableAttribute.type ?? savedVariableAttribute.type,
              value: variableAttribute.value ?? null,
              mutability: variableAttribute.mutability ?? savedVariableAttribute.mutability,
              persistent: variableAttribute.persistent ?? false,
              constant: variableAttribute.constant ?? false,
              generatedAt: isoTimestamp,
            },
            savedVariableAttribute.id,
          )) as VariableAttribute;
        }
        return savedVariableAttribute;
      }),
    );
  }

  async findOrCreateEvseAndComponentAndVariable(componentType: OCPP2_0_1.ComponentType, variableType: OCPP2_0_1.VariableType, stationId?: string): Promise<[Component, Variable]> {
    const component = await this.findOrCreateEvseAndComponent(componentType, stationId);

    const [variable] = await this.variable.readOrCreateByQuery({
      where: { name: variableType.name, instance: variableType.instance ? variableType.instance : null },
      defaults: {
        ...variableType,
      },
    });

    // TODO discuss & verify appropriate way to remove associations between components and variables (not currently possible)

    // This can happen asynchronously
    this.componentVariable.readOrCreateByQuery({
      where: { componentId: component.id, variableId: variable.id },
    });

    return [component, variable];
  }

  async findOrCreateEvseAndComponent(componentType: OCPP2_0_1.ComponentType, stationId?: string): Promise<Component> {
    const evse = componentType.evse
      ? (
          await this.evse.readOrCreateByQuery({
            where: {
              id: componentType.evse.id,
              connectorId: componentType.evse.connectorId ? componentType.evse.connectorId : null,
            },
          })
        )[0]
      : undefined;

    const [component, componentCreated] = await this.component.readOrCreateByQuery({
      where: { name: componentType.name, instance: componentType.instance ? componentType.instance : null },
      defaults: {
        // Explicit assignment because evse field is a relation and is not able to accept a default value
        name: componentType.name,
        instance: componentType.instance,
      },
    });
    // Note: this permits changing the evse related to the component
    if (component.evseDatabaseId !== evse?.databaseId && evse) {
      await this.component.updateByKey({ evseDatabaseId: evse.databaseId }, component.get('id'));
    }

    if (componentCreated && stationId) {
      // Only execute if this method is called in the context of a specific station
      // Excerpt from OCPP 2.0.1 Part 1 Architecture & Topology - 4.2 :
      // "When a Charging Station does not report: Present, Available and/or Enabled
      // the Central System SHALL assume them to be readonly and set to true."
      // These default variables and their attributes are created here if the component is new,
      // and they will be overwritten if they are included in the update
      const defaultComponentVariableNames = ['Present', 'Available', 'Enabled'];
      for (const defaultComponentVariableName of defaultComponentVariableNames) {
        const [defaultComponentVariable, _defaultComponentVariableCreated] = await this.variable.readOrCreateByQuery({
          where: {
            name: defaultComponentVariableName,
            instance: null,
          },
        });

        // This can happen asynchronously
        this.componentVariable.readOrCreateByQuery({
          where: { componentId: component.id, variableId: defaultComponentVariable.id },
        });

        await this.create(
          VariableAttribute.build({
            stationId,
            variableId: defaultComponentVariable.id,
            componentId: component.id,
            evseDatabaseId: evse?.databaseId,
            dataType: OCPP2_0_1.DataEnumType.boolean,
            value: 'true',
            mutability: OCPP2_0_1.MutabilityEnumType.ReadOnly,
          }),
        );
      }
    }

    return component;
  }

  async createOrUpdateByGetVariablesResultAndStationId(getVariablesResult: OCPP2_0_1.GetVariableResultType[], stationId: string, isoTimestamp: string): Promise<VariableAttribute[]> {
    const savedVariableAttributes: VariableAttribute[] = [];
    for (const result of getVariablesResult) {
      const savedVariableAttribute = (
        await this.createOrUpdateDeviceModelByStationId(
          {
            component: {
              ...result.component,
            },
            variable: {
              ...result.variable,
            },
            variableAttribute: [
              {
                type: result.attributeType,
                value: result.attributeValue,
              },
            ],
          },
          stationId,
          isoTimestamp,
        )
      )[0];
      this.variableStatus.create(
        VariableStatus.build(
          {
            value: result.attributeValue,
            status: result.attributeStatus,
            statusInfo: result.attributeStatusInfo,
            variableAttributeId: savedVariableAttribute.get('id'),
          },
          { include: [VariableAttribute] },
        ),
      );
      savedVariableAttributes.push(savedVariableAttribute);
    }
    return savedVariableAttributes;
  }

  async createOrUpdateBySetVariablesDataAndStationId(setVariablesData: OCPP2_0_1.SetVariableDataType[], stationId: string, isoTimestamp: string): Promise<VariableAttribute[]> {
    const savedVariableAttributes: VariableAttribute[] = [];
    for (const data of setVariablesData) {
      const savedVariableAttribute = (
        await this.createOrUpdateDeviceModelByStationId(
          {
            component: {
              ...data.component,
            },
            variable: {
              ...data.variable,
            },
            variableAttribute: [
              {
                type: data.attributeType,
                value: data.attributeValue,
              },
            ],
          },
          stationId,
          isoTimestamp,
        )
      )[0];
      savedVariableAttributes.push(savedVariableAttribute);
    }
    return savedVariableAttributes;
  }

  async updateResultByStationId(result: OCPP2_0_1.SetVariableResultType, stationId: string, isoTimestamp: string): Promise<VariableAttribute | undefined> {
    const savedVariableAttribute = await super.readOnlyOneByQuery({
      where: { stationId, type: result.attributeType ?? OCPP2_0_1.AttributeEnumType.Actual },
      include: [
        {
          model: Component,
          where: {
            name: result.component.name,
            instance: result.component.instance ? result.component.instance : null,
          },
        },
        {
          model: Variable,
          where: {
            name: result.variable.name,
            instance: result.variable.instance ? result.variable.instance : null,
          },
        },
      ],
    });
    if (savedVariableAttribute) {
      await this.variableStatus.create(
        VariableStatus.build({
          value: savedVariableAttribute.value,
          status: result.attributeStatus,
          statusInfo: result.attributeStatusInfo,
          variableAttributeId: savedVariableAttribute.get('id'),
        }),
      );
      if (result.attributeStatus !== OCPP2_0_1.SetVariableStatusEnumType.Accepted) {
        const mostRecentAcceptedStatus = (
          await this.variableStatus.readAllByQuery({
            where: { variableAttributeId: savedVariableAttribute.get('id'), status: OCPP2_0_1.SetVariableStatusEnumType.Accepted },
            limit: 1,
            order: [['createdAt', 'DESC']],
          })
        )[0];
        savedVariableAttribute.setDataValue('value', mostRecentAcceptedStatus?.value);
      }
      savedVariableAttribute.set('generatedAt', isoTimestamp);
      await savedVariableAttribute.save();
      // Reload in order to include the statuses
      return await savedVariableAttribute.reload({
        include: [VariableStatus],
      });
    } else {
      throw new Error('Unable to update variable attribute status...');
    }
  }

  async readAllSetVariableByStationId(stationId: string): Promise<OCPP2_0_1.SetVariableDataType[]> {
    const variableAttributeArray = await super.readAllByQuery({
      where: {
        stationId,
        bootConfigSetId: { [Op.ne]: null },
      },
      include: [{ model: Component, include: [Evse] }, Variable],
    });

    return variableAttributeArray.map((variableAttribute) => this.createSetVariableDataType(variableAttribute));
  }

  async readAllByQuerystring(query: VariableAttributeQuerystring): Promise<VariableAttribute[]> {
    const readQuery = this.constructQuery(query);
    readQuery.include.push(VariableStatus);
    return await super.readAllByQuery(readQuery);
  }

  async existByQuerystring(query: VariableAttributeQuerystring): Promise<number> {
    return await super.existByQuery(this.constructQuery(query));
  }

  async deleteAllByQuerystring(query: VariableAttributeQuerystring): Promise<VariableAttribute[]> {
    return await super.deleteAllByQuery(this.constructQuery(query));
  }

  async findComponentAndVariable(componentType: OCPP2_0_1.ComponentType, variableType: OCPP2_0_1.VariableType): Promise<[Component | undefined, Variable | undefined]> {
    const component = await this.component.readOnlyOneByQuery({
      where: { name: componentType.name, instance: componentType.instance ? componentType.instance : null },
    });
    const variable = await this.variable.readOnlyOneByQuery({
      where: { name: variableType.name, instance: variableType.instance ? variableType.instance : null },
    });
    if (variable) {
      const variableCharacteristics = await this.variableCharacteristics.readOnlyOneByQuery({
        where: { variableId: variable.get('id') },
      });
      variable.variableCharacteristics = variableCharacteristics;
    }

    return [component, variable];
  }

  async findEvseByIdAndConnectorId(id: number, connectorId: number | null): Promise<Evse | undefined> {
    const storedEvses = await this.evse.readAllByQuery({
      where: {
        // unique constraints
        id: id,
        connectorId: connectorId,
      },
    });
    return storedEvses.length > 0 ? storedEvses[0] : undefined;
  }

  async findVariableCharacteristicsByVariableNameAndVariableInstance(variableName: string, variableInstance: string | null): Promise<VariableCharacteristics | undefined> {
    const variableCharacteristics = await this.variableCharacteristics.readAllByQuery({
      include: [
        {
          model: Variable,
          where: {
            name: variableName,
            instance: variableInstance,
          },
        },
      ],
    });
    return variableCharacteristics.length > 0 ? variableCharacteristics[0] : undefined;
  }

  /**
   * Private Methods
   */

  private createSetVariableDataType(input: VariableAttribute): OCPP2_0_1.SetVariableDataType {
    if (!input.value) {
      throw new Error('Value must be present to generate SetVariableDataType from VariableAttribute');
    } else {
      return {
        attributeType: input.type,
        attributeValue: input.value,
        component: {
          ...input.component,
        },
        variable: {
          ...input.variable,
        },
      };
    }
  }

  private constructQuery(queryParams: VariableAttributeQuerystring): any {
    const evseInclude =
      queryParams.component_evse_id ?? queryParams.component_evse_connectorId
        ? {
            model: Evse,
            where: {
              ...(queryParams.component_evse_id ? { id: queryParams.component_evse_id } : {}),
              ...(queryParams.component_evse_connectorId ? { connectorId: queryParams.component_evse_connectorId } : {}),
            },
          }
        : Evse;
    const attributeType = queryParams.type && queryParams.type.toUpperCase() === 'NULL' ? null : queryParams.type;
    return {
      where: {
        ...(queryParams.stationId ? { stationId: queryParams.stationId } : {}),
        ...(queryParams.type === undefined ? {} : { type: attributeType }),
        ...(queryParams.value ? { value: queryParams.value } : {}),
        // TODO: Currently, the status param doesn't work since status of VariableAttribute are stored in
        //  VariableStatuses table separately. The table stores status history. We need find a proper way to filter it.
        ...(queryParams.status === undefined ? {} : { status: queryParams.status }),
      },
      include: [
        {
          model: Component,
          where: {
            ...(queryParams.component_name ? { name: queryParams.component_name } : {}),
            ...(queryParams.component_instance ? { instance: queryParams.component_instance } : {}),
          },
          include: [evseInclude],
        },
        {
          model: Variable,
          where: {
            ...(queryParams.variable_name ? { name: queryParams.variable_name } : {}),
            ...(queryParams.variable_instance ? { instance: queryParams.variable_instance } : {}),
          },
          include: [VariableCharacteristics],
        },
      ],
    };
  }
}
