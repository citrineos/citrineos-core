// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { SequelizeRepository, type SequelizeRepositoryDependencies } from './Base.js';
import { Component } from '../model/DeviceModel/Component.js';
import { EventData } from '../model/VariableMonitoring/EventData.js';
import { Variable } from '../model/DeviceModel/Variable.js';
import { VariableMonitoring } from '../model/VariableMonitoring/VariableMonitoring.js';
import { VariableMonitoringStatus } from '../model/VariableMonitoring/VariableMonitoringStatus.js';
import type { IVariableMonitoringRepository } from '../../../interfaces/repositories.js';
import type { CallAction, OCPP2_common_types, SetMonitoringStatusEnumType } from '@citrineos/base';
import {
  CrudRepository,
  OCPP2_0_1,
  OCPP_CallAction,
  SetMonitoringStatusEnum,
} from '@citrineos/base';

export class SequelizeVariableMonitoringRepository
  extends SequelizeRepository<VariableMonitoring>
  implements IVariableMonitoringRepository
{
  eventData: CrudRepository<EventData>;
  variableMonitoringStatus: CrudRepository<VariableMonitoringStatus>;

  constructor({ config, logger, sequelizeInstance }: SequelizeRepositoryDependencies) {
    super({ config, namespace: VariableMonitoring.MODEL_NAME, logger, sequelizeInstance });
    this.eventData = new SequelizeRepository<EventData>({
      config,
      namespace: EventData.MODEL_NAME,
      logger,
      sequelizeInstance,
    });
    this.variableMonitoringStatus = new SequelizeRepository<VariableMonitoringStatus>({
      config,
      namespace: VariableMonitoringStatus.MODEL_NAME,
      logger,
      sequelizeInstance,
    });
  }

  async createOrUpdateByMonitoringDataTypeAndStationId(
    tenantId: number,
    value: OCPP2_common_types.MonitoringDataType,
    componentId: string,
    variableId: string,
    ocppConnectionName: string,
  ): Promise<VariableMonitoring[]> {
    return await Promise.all(
      value.variableMonitoring.map(
        async (variableMonitoring: OCPP2_common_types.VariableMonitoringType) => {
          const savedVariableMonitoring: VariableMonitoring = await this.s.transaction(
            async (transaction) => {
              const existingVariableMonitoring = await this.s.models[
                VariableMonitoring.MODEL_NAME
              ].findOne({
                where: { ocppConnectionName: ocppConnectionName, variableId, componentId },
                transaction,
              });

              if (!existingVariableMonitoring) {
                // If the record does not exist, build and save a new instance
                const vm = VariableMonitoring.build({
                  tenantId,
                  ocppConnectionName: ocppConnectionName,
                  variableId,
                  componentId,
                  ...variableMonitoring,
                });
                const createdVariableMonitoring = await vm.save({ transaction });
                this.emit('created', [createdVariableMonitoring]);
                return createdVariableMonitoring;
              } else {
                // If the record exists, update it
                return (await this.updateByKey(
                  tenantId,
                  { ...variableMonitoring } as Partial<VariableMonitoring>,
                  existingVariableMonitoring.dataValues.databaseId,
                )) as VariableMonitoring;
              }
            },
          );
          await this.createVariableMonitoringStatus(
            tenantId,
            SetMonitoringStatusEnum.Accepted,
            OCPP_CallAction.NotifyMonitoringReport,
            savedVariableMonitoring.get('databaseId'),
          );

          return savedVariableMonitoring;
        },
      ),
    );
  }

  async createVariableMonitoringStatus(
    tenantId: number,
    status: SetMonitoringStatusEnumType,
    action: CallAction,
    variableMonitoringId: number,
  ): Promise<void> {
    await this.variableMonitoringStatus.create(
      tenantId,
      VariableMonitoringStatus.build({
        tenantId,
        status,
        statusInfo: { reasonCode: action },
        variableMonitoringId,
      }),
    );
  }

  async createOrUpdateBySetMonitoringDataTypeAndStationId(
    tenantId: number,
    value: OCPP2_0_1.SetMonitoringDataType,
    componentId: string,
    variableId: string,
    ocppConnectionName: string,
  ): Promise<VariableMonitoring> {
    let result: VariableMonitoring | null = null;

    await this.s.transaction(async (transaction) => {
      const savedVariableMonitoring = await this.s.models[VariableMonitoring.MODEL_NAME].findOne({
        where: { ocppConnectionName: ocppConnectionName, variableId, componentId },
        transaction,
      });

      if (!savedVariableMonitoring) {
        const variableMonitoring = VariableMonitoring.build({
          tenantId,
          ocppConnectionName: ocppConnectionName,
          variableId,
          componentId,
          ...value,
        });
        result = await variableMonitoring.save({ transaction });
        this.emit('created', [result]);
      } else {
        const updatedVariableMonitoring = await savedVariableMonitoring.update(value, {
          transaction,
          returning: true,
        });
        result = updatedVariableMonitoring as VariableMonitoring;
        this.emit('updated', [result]);
      }
    });

    if (!result) {
      throw new Error('VariableMonitoring could not be created or updated');
    }

    return result;
  }

  async rejectAllVariableMonitoringsByStationId(
    tenantId: number,
    action: CallAction,
    ocppConnectionName: string,
  ): Promise<void> {
    await this.readAllByQuery(tenantId, {
      where: {
        ocppConnectionName: ocppConnectionName,
      },
    }).then(async (variableMonitorings) => {
      for (const variableMonitoring of variableMonitorings) {
        await this.createVariableMonitoringStatus(
          tenantId,
          OCPP2_0_1.SetMonitoringStatusEnumType.Rejected,
          action,
          variableMonitoring.databaseId,
        );
      }
    });
  }

  async rejectVariableMonitoringByIdAndStationId(
    tenantId: number,
    action: CallAction,
    id: number,
    ocppConnectionName: string,
  ): Promise<void> {
    await this.readAllByQuery(tenantId, {
      where: {
        id,
        ocppConnectionName: ocppConnectionName,
      },
    }).then(async (variableMonitorings) => {
      for (const variableMonitoring of variableMonitorings) {
        await this.createVariableMonitoringStatus(
          tenantId,
          OCPP2_0_1.SetMonitoringStatusEnumType.Rejected,
          action,
          variableMonitoring.databaseId,
        );
      }
    });
  }

  async updateResultByStationId(
    tenantId: number,
    result: OCPP2_0_1.SetMonitoringResultType,
    ocppConnectionName: string,
  ): Promise<VariableMonitoring> {
    const savedVariableMonitoring = await super
      .readAllByQuery(tenantId, {
        where: {
          ocppConnectionName: ocppConnectionName,
          type: result.type,
          severity: result.severity,
        },
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
      })
      .then((variableMonitorings) => variableMonitorings[0]); // TODO: Make sure this uniqueness constraint is actually enforced.

    if (savedVariableMonitoring) {
      // The Id is only returned from Charging Station when status is accepted.
      if (result.status === OCPP2_0_1.SetMonitoringStatusEnumType.Accepted && result.id) {
        await this.updateByKey(
          tenantId,
          {
            id: result.id,
          },
          savedVariableMonitoring.get('databaseId').toString(),
        );
      }

      await this.variableMonitoringStatus.create(
        tenantId,
        VariableMonitoringStatus.build({
          tenantId,
          status: result.status,
          statusInfo: result.statusInfo,
          variableMonitoringId: savedVariableMonitoring.get('databaseId'),
        }),
      );
      // Reload in order to include the statuses
      return await this.readAllByQuery(tenantId, {
        where: { databaseId: savedVariableMonitoring.get('databaseId') },
        include: [VariableMonitoringStatus],
      }).then((variableMonitorings) => variableMonitorings[0]);
    } else {
      throw new Error(`Unable to update set monitoring result: ${result}`);
    }
  }

  async createEventDatumByComponentIdAndVariableIdAndStationId(
    tenantId: number,
    event: OCPP2_0_1.EventDataType,
    componentId: string,
    variableId: string,
    ocppConnectionName: string,
  ): Promise<EventData> {
    return await this.eventData.create(
      tenantId,
      EventData.build({
        tenantId,
        ocppConnectionName: ocppConnectionName,
        variableId,
        componentId,
        ...event,
      }),
    );
  }
}

export default SequelizeVariableMonitoringRepository;
