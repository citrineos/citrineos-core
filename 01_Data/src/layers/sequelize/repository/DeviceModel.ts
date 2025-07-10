// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { CrudRepository, OCPP2_0_1, BootstrapConfig } from '@citrineos/base';
import { SequelizeRepository } from './Base';
import {
  type IDeviceModelRepository,
  type VariableAttributeQuerystring,
} from '../../../interfaces';
import { Op } from 'sequelize';
import {
  Component,
  Evse,
  Variable,
  VariableAttribute,
  VariableCharacteristics,
  VariableStatus,
} from '../model/DeviceModel';
import { ComponentVariable } from '../model/DeviceModel/ComponentVariable';
import { Sequelize } from 'sequelize-typescript';
import { ILogObj, Logger } from 'tslog'; // TODO: Document this

// TODO: Document this

export class SequelizeDeviceModelRepository
  extends SequelizeRepository<VariableAttribute>
  implements IDeviceModelRepository
{
  variable: CrudRepository<Variable>;
  component: CrudRepository<Component>;
  evse: CrudRepository<Evse>;
  variableCharacteristics: CrudRepository<VariableCharacteristics>;
  componentVariable: CrudRepository<ComponentVariable>;
  variableStatus: CrudRepository<VariableStatus>;

  constructor(
    config: BootstrapConfig,
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
    this.variable = variable
      ? variable
      : new SequelizeRepository<Variable>(config, Variable.MODEL_NAME, logger, sequelizeInstance);
    this.component = component
      ? component
      : new SequelizeRepository<Component>(config, Component.MODEL_NAME, logger, sequelizeInstance);
    this.evse = evse
      ? evse
      : new SequelizeRepository<Evse>(config, Evse.MODEL_NAME, logger, sequelizeInstance);
    this.componentVariable = componentVariable
      ? componentVariable
      : new SequelizeRepository<ComponentVariable>(
          config,
          ComponentVariable.MODEL_NAME,
          logger,
          sequelizeInstance,
        );
    this.variableCharacteristics = variableCharacteristics
      ? variableCharacteristics
      : new SequelizeRepository<VariableCharacteristics>(
          config,
          VariableCharacteristics.MODEL_NAME,
          logger,
          sequelizeInstance,
        );
    this.variableStatus = variableStatus
      ? variableStatus
      : new SequelizeRepository<VariableStatus>(
          config,
          VariableStatus.MODEL_NAME,
          logger,
          sequelizeInstance,
        );
  }

  async createOrUpdateDeviceModelByStationId(
    tenantId: number,
    value: OCPP2_0_1.ReportDataType,
    stationId: string,
    isoTimestamp: string,
  ): Promise<VariableAttribute[]> {
    // Doing this here so that no records are created if the data is invalid
    const variableAttributeTypes = value.variableAttribute.map(
      (attr) => attr.type ?? OCPP2_0_1.AttributeEnumType.Actual,
    );
    if (variableAttributeTypes.length !== new Set(variableAttributeTypes).size) {
      throw new Error('All variable attributes in ReportData must have different types.');
    }

    const [component, variable] = await this.findOrCreateEvseAndComponentAndVariable(
      tenantId,
      value.component,
      value.variable,
      stationId,
    );

    let dataType: OCPP2_0_1.DataEnumType | null = null;

    if (value.variableCharacteristics) {
      const variableCharacteristicsType = value.variableCharacteristics;
      dataType = variableCharacteristicsType.dataType;
      const vc = {
        tenantId,
        unit: variableCharacteristicsType.unit ?? null,
        dataType,
        minLimit: variableCharacteristicsType.minLimit ?? null,
        maxLimit: variableCharacteristicsType.maxLimit ?? null,
        valuesList: variableCharacteristicsType.valuesList ?? null,
        supportsMonitoring: variableCharacteristicsType.supportsMonitoring,
        variableId: variable.id,
      };
      await this.s.transaction(async (transaction) => {
        const savedVariableCharacteristics = await this.s.models[
          VariableCharacteristics.MODEL_NAME
        ].findOne({
          where: {
            variableId: variable.id,
          },
          transaction,
        });

        if (!savedVariableCharacteristics) {
          const createdVariableCharacteristics = await VariableCharacteristics.create(vc, {
            transaction,
          });
          this.variableCharacteristics.emit('created', [createdVariableCharacteristics]);
          return createdVariableCharacteristics;
        } else {
          return await this.variableCharacteristics.updateAllByQuery(tenantId, vc, {
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
        const [savedVariableAttribute, variableAttributeCreated] = await this.readOrCreateByQuery(
          tenantId,
          {
            where: {
              tenantId,
              // the composite unique index of VariableAttribute
              stationId: stationId,
              variableId: variable.id,
              componentId: component.id,
              type: variableAttribute.type ?? OCPP2_0_1.AttributeEnumType.Actual,
            },
            defaults: {
              evseDatabaseId: component.evseDatabaseId,
              dataType,
              value: variableAttribute.value,
              generatedAt: isoTimestamp,
              mutability: variableAttribute.mutability ?? OCPP2_0_1.MutabilityEnumType.ReadWrite,
              persistent: variableAttribute.persistent ? variableAttribute.persistent : false,
              constant: variableAttribute.constant ? variableAttribute.constant : false,
            },
          },
        );
        if (!variableAttributeCreated) {
          return (await this.updateByKey(
            tenantId,
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

  async findOrCreateEvseAndComponentAndVariable(
    tenantId: number,
    componentType: OCPP2_0_1.ComponentType,
    variableType: OCPP2_0_1.VariableType,
    stationId?: string,
  ): Promise<[Component, Variable]> {
    const component = await this.findOrCreateEvseAndComponent(tenantId, componentType, stationId);

    const [variable] = await this.variable.readOrCreateByQuery(tenantId, {
      where: {
        tenantId,
        name: variableType.name,
        instance: variableType.instance ? variableType.instance : null,
      },
      defaults: {
        ...variableType,
      },
    });

    // This can happen asynchronously
    await this.componentVariable.readOrCreateByQuery(tenantId, {
      where: { tenantId, componentId: component.id, variableId: variable.id },
    });

    return [component, variable];
  }

  async findOrCreateEvseAndComponent(
    tenantId: number,
    componentType: OCPP2_0_1.ComponentType,
    stationId?: string,
  ): Promise<Component> {
    const evse = componentType.evse
      ? (
          await this.evse.readOrCreateByQuery(tenantId, {
            where: {
              tenantId,
              id: componentType.evse.id,
              connectorId: componentType.evse.connectorId ? componentType.evse.connectorId : null,
            },
          })
        )[0]
      : undefined;

    const [component, componentCreated] = await this.component.readOrCreateByQuery(tenantId, {
      where: {
        tenantId,
        name: componentType.name,
        instance: componentType.instance ? componentType.instance : null,
      },
    });
    // Note: this permits changing the evse related to the component
    if (component.evseDatabaseId !== evse?.databaseId && evse) {
      await this.component.updateByKey(
        tenantId,
        { evseDatabaseId: evse.databaseId },
        component.get('id'),
      );
    }

    if (componentCreated && stationId) {
      const defaultComponentVariableNames = ['Present', 'Available', 'Enabled'];
      for (const defaultComponentVariableName of defaultComponentVariableNames) {
        const [defaultComponentVariable, _defaultComponentVariableCreated] =
          await this.variable.readOrCreateByQuery(tenantId, {
            where: {
              tenantId,
              name: defaultComponentVariableName,
              instance: null,
            },
          });

        await this.componentVariable.readOrCreateByQuery(tenantId, {
          where: { tenantId, componentId: component.id, variableId: defaultComponentVariable.id },
        });

        await this.create(
          tenantId,
          VariableAttribute.build({
            tenantId,
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

  async createOrUpdateByGetVariablesResultAndStationId(
    tenantId: number,
    getVariablesResult: OCPP2_0_1.GetVariableResultType[],
    stationId: string,
    isoTimestamp: string,
  ): Promise<VariableAttribute[]> {
    const savedVariableAttributes: VariableAttribute[] = [];
    for (const result of getVariablesResult) {
      const savedVariableAttribute = (
        await this.createOrUpdateDeviceModelByStationId(
          tenantId,
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
      await this.variableStatus.create(
        tenantId,
        VariableStatus.build(
          {
            tenantId,
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

  async createOrUpdateBySetVariablesDataAndStationId(
    tenantId: number,
    setVariablesData: OCPP2_0_1.SetVariableDataType[],
    stationId: string,
    isoTimestamp: string,
  ): Promise<VariableAttribute[]> {
    const savedVariableAttributes: VariableAttribute[] = [];
    for (const data of setVariablesData) {
      const savedVariableAttribute = (
        await this.createOrUpdateDeviceModelByStationId(
          tenantId,
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

  async updateResultByStationId(
    tenantId: number,
    result: OCPP2_0_1.SetVariableResultType,
    stationId: string,
    isoTimestamp: string,
  ): Promise<VariableAttribute | undefined> {
    const savedVariableAttribute = await super.readOnlyOneByQuery(tenantId, {
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
        tenantId,
        VariableStatus.build({
          tenantId,
          value: savedVariableAttribute.value,
          status: result.attributeStatus,
          statusInfo: result.attributeStatusInfo,
          variableAttributeId: savedVariableAttribute.get('id'),
        }),
      );
      if (result.attributeStatus !== OCPP2_0_1.SetVariableStatusEnumType.Accepted) {
        const mostRecentAcceptedStatus = (
          await this.variableStatus.readAllByQuery(tenantId, {
            where: {
              variableAttributeId: savedVariableAttribute.get('id'),
              status: OCPP2_0_1.SetVariableStatusEnumType.Accepted,
            },
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

  async readAllSetVariableByStationId(
    tenantId: number,
    stationId: string,
  ): Promise<OCPP2_0_1.SetVariableDataType[]> {
    const variableAttributeArray = await super.readAllByQuery(tenantId, {
      where: {
        stationId,
        bootConfigSetId: { [Op.ne]: null },
      },
      include: [{ model: Component, include: [Evse] }, Variable],
    });

    return variableAttributeArray.map((variableAttribute) =>
      this.createSetVariableDataType(variableAttribute),
    );
  }

  async readAllByQuerystring(
    tenantId: number,
    query: VariableAttributeQuerystring,
  ): Promise<VariableAttribute[]> {
    const readQuery = this.constructQuery(query);
    readQuery.include.push(VariableStatus);
    return await super.readAllByQuery(tenantId, readQuery);
  }

  async existByQuerystring(tenantId: number, query: VariableAttributeQuerystring): Promise<number> {
    return await super.existByQuery(tenantId, this.constructQuery(query));
  }

  async deleteAllByQuerystring(
    tenantId: number,
    query: VariableAttributeQuerystring,
  ): Promise<VariableAttribute[]> {
    return await super.deleteAllByQuery(tenantId, this.constructQuery(query));
  }

  async findComponentAndVariable(
    tenantId: number,
    componentType: OCPP2_0_1.ComponentType,
    variableType: OCPP2_0_1.VariableType,
  ): Promise<[Component | undefined, Variable | undefined]> {
    const component = await this.component.readOnlyOneByQuery(tenantId, {
      where: {
        name: componentType.name,
        instance: componentType.instance ? componentType.instance : null,
      },
    });
    const variable = await this.variable.readOnlyOneByQuery(tenantId, {
      where: {
        name: variableType.name,
        instance: variableType.instance ? variableType.instance : null,
      },
    });
    if (variable) {
      const variableCharacteristics = await this.variableCharacteristics.readOnlyOneByQuery(
        tenantId,
        {
          where: { variableId: variable.get('id') },
        },
      );
      variable.variableCharacteristics = variableCharacteristics;
    }

    return [component, variable];
  }

  async findEvseByIdAndConnectorId(
    tenantId: number,
    id: number,
    connectorId: number | null,
  ): Promise<Evse | undefined> {
    const storedEvses = await this.evse.readAllByQuery(tenantId, {
      where: {
        id: id,
        connectorId: connectorId,
      },
    });
    return storedEvses.length > 0 ? storedEvses[0] : undefined;
  }

  async findVariableCharacteristicsByVariableNameAndVariableInstance(
    tenantId: number,
    variableName: string,
    variableInstance: string | null,
  ): Promise<VariableCharacteristics | undefined> {
    const variableCharacteristics = await this.variableCharacteristics.readAllByQuery(tenantId, {
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
      throw new Error(
        'Value must be present to generate SetVariableDataType from VariableAttribute',
      );
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
              ...(queryParams.component_evse_connectorId
                ? { connectorId: queryParams.component_evse_connectorId }
                : {}),
            },
          }
        : Evse;
    const attributeType =
      queryParams.type && queryParams.type.toUpperCase() === 'NULL' ? null : queryParams.type;
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
