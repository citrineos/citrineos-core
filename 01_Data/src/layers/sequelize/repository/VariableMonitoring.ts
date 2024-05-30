// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { SequelizeRepository } from './Base';
import { EventData, VariableMonitoring, VariableMonitoringStatus } from '../model/VariableMonitoring';
import { type IVariableMonitoringRepository } from '../../../interfaces';
import { CallAction, type EventDataType, type MonitoringDataType, type SetMonitoringDataType, type SetMonitoringResultType, SetMonitoringStatusEnumType, CrudRepository, SystemConfig } from '@citrineos/base';
import { Component, Variable } from '../model/DeviceModel';
import { Sequelize } from 'sequelize-typescript';
import { Logger, ILogObj } from 'tslog';

export class SequelizeVariableMonitoringRepository extends SequelizeRepository<VariableMonitoring> implements IVariableMonitoringRepository {
  eventData: CrudRepository<EventData>;
  variableMonitoringStatus: CrudRepository<VariableMonitoringStatus>;

  constructor(config: SystemConfig, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize, eventData?: CrudRepository<EventData>, variableMonitoringStatus?: CrudRepository<VariableMonitoringStatus>) {
    super(config, VariableMonitoring.MODEL_NAME, logger, sequelizeInstance);
    this.eventData = eventData ? eventData : new SequelizeRepository<EventData>(config, EventData.MODEL_NAME, logger, sequelizeInstance);
    this.variableMonitoringStatus = variableMonitoringStatus ? variableMonitoringStatus : new SequelizeRepository<VariableMonitoringStatus>(config, VariableMonitoringStatus.MODEL_NAME, logger, sequelizeInstance);
  }

  async createOrUpdateByMonitoringDataTypeAndStationId(value: MonitoringDataType, componentId: string, variableId: string, stationId: string): Promise<VariableMonitoring[]> {
    return await Promise.all(
      value.variableMonitoring.map(async (variableMonitoring) => {
        const [savedVariableMonitoring, _variableMonitoringCreated] = await this.upsert(
          VariableMonitoring.build({
            stationId,
            variableId,
            componentId,
            ...variableMonitoring,
          }),
        );

        await this.createVariableMonitoringStatus(SetMonitoringStatusEnumType.Accepted, CallAction.NotifyMonitoringReport, savedVariableMonitoring.get('databaseId'));

        return savedVariableMonitoring;
      }),
    );
  }

  async createVariableMonitoringStatus(status: SetMonitoringStatusEnumType, action: CallAction, variableMonitoringId: number): Promise<void> {
    await this.variableMonitoringStatus.create(
      VariableMonitoringStatus.build({
        status,
        statusInfo: { reasonCode: action },
        variableMonitoringId,
      }),
    );
  }

  async createOrUpdateBySetMonitoringDataTypeAndStationId(value: SetMonitoringDataType, componentId: string, variableId: string, stationId: string): Promise<VariableMonitoring> {
    const [savedVariableMonitoring, _variableMonitoringCreated] = await this.upsert(
      VariableMonitoring.build({
        stationId,
        variableId,
        componentId,
        ...value,
      }),
    );
    return savedVariableMonitoring;
  }

  async rejectAllVariableMonitoringsByStationId(action: CallAction, stationId: string): Promise<void> {
    await this.readAllByQuery({
      where: {
        stationId,
      },
    }).then(async (variableMonitorings) => {
      for (const variableMonitoring of variableMonitorings) {
        await this.createVariableMonitoringStatus(SetMonitoringStatusEnumType.Rejected, action, variableMonitoring.databaseId);
      }
    });
  }

  async rejectVariableMonitoringByIdAndStationId(action: CallAction, id: number, stationId: string): Promise<void> {
    // use findAll since according to the OCPP 2.0.1 installed VariableMonitors should have unique id’s
    // but the id’s of removed Installed monitors should have unique id’s
    // but the id’s of removed monitors MAY be reused.
    await this.readAllByQuery({
      where: {
        id,
        stationId,
      },
    }).then(async (variableMonitorings) => {
      for (const variableMonitoring of variableMonitorings) {
        await this.createVariableMonitoringStatus(SetMonitoringStatusEnumType.Rejected, action, variableMonitoring.databaseId);
      }
    });
  }

  async updateResultByStationId(result: SetMonitoringResultType, stationId: string): Promise<VariableMonitoring> {
    const savedVariableMonitoring = await super
      .readAllByQuery({
        where: { stationId, type: result.type, severity: result.severity },
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
      if (result.status === SetMonitoringStatusEnumType.Accepted) {
        await this.updateByKey(
          {
            id: result.id,
          },
          savedVariableMonitoring.get('databaseId').toString(),
        );
      }

      await this.variableMonitoringStatus.create(
        VariableMonitoringStatus.build({
          status: result.status,
          statusInfo: result.statusInfo,
          variableMonitoringId: savedVariableMonitoring.get('databaseId'),
        }),
      );
      // Reload in order to include the statuses
      return await this.readAllByQuery({
        where: { databaseId: savedVariableMonitoring.get('databaseId') },
        include: [VariableMonitoringStatus],
      }).then((variableMonitorings) => variableMonitorings[0]);
    } else {
      throw new Error(`Unable to update set monitoring result: ${result}`);
    }
  }

  async createEventDatumByComponentIdAndVariableIdAndStationId(event: EventDataType, componentId: string, variableId: string, stationId: string): Promise<EventData> {
    return await this.eventData.create(
      EventData.build({
        stationId,
        variableId,
        componentId,
        ...event,
      }),
    );
  }
}
