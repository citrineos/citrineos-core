// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { SequelizeRepository } from './Base.js';
import { Component, Variable, VariableMonitoring } from '../model/index.js';
import type { IVariableMonitoringRepository } from '../../../interfaces/index.js';
import type { BootstrapConfig } from '@citrineos/base';
import { OCPP2_0_1 } from '@citrineos/base';
import { Sequelize } from 'sequelize-typescript';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';

export class SequelizeVariableMonitoringRepository
  extends SequelizeRepository<VariableMonitoring>
  implements IVariableMonitoringRepository
{
  constructor(config: BootstrapConfig, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize) {
    super(config, VariableMonitoring.MODEL_NAME, logger, sequelizeInstance);
  }

  async createOrUpdateByMonitoringDataTypeAndStationId(
    tenantId: number,
    value: OCPP2_0_1.MonitoringDataType,
    componentId: string,
    variableId: string,
    stationId: string,
  ): Promise<VariableMonitoring[]> {
    return await Promise.all(
      value.variableMonitoring.map(
        async (variableMonitoring) =>
          await this.s.transaction(async (transaction) => {
            const existingVariableMonitoring = await this.s.models[
              VariableMonitoring.MODEL_NAME
            ].findOne({
              where: { stationId, variableId, componentId },
              transaction,
            });

            if (!existingVariableMonitoring) {
              // If the record does not exist, build and save a new instance
              const vm = VariableMonitoring.build({
                tenantId,
                stationId,
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
                { ...variableMonitoring },
                existingVariableMonitoring.dataValues.databaseId,
              )) as VariableMonitoring;
            }
          }),
      ),
    );
  }

  async createOrUpdateBySetMonitoringDataTypeAndStationId(
    tenantId: number,
    value: OCPP2_0_1.SetMonitoringDataType,
    componentId: string,
    variableId: string,
    stationId: string,
  ): Promise<VariableMonitoring> {
    let result: VariableMonitoring | null = null;

    await this.s.transaction(async (transaction) => {
      const savedVariableMonitoring = await this.s.models[VariableMonitoring.MODEL_NAME].findOne({
        where: { stationId, variableId, componentId },
        transaction,
      });

      if (!savedVariableMonitoring) {
        const variableMonitoring = VariableMonitoring.build({
          tenantId,
          stationId,
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

  async updateResultByStationId(
    tenantId: number,
    result: OCPP2_0_1.SetMonitoringResultType,
    stationId: string,
  ): Promise<VariableMonitoring> {
    const savedVariableMonitoring = await super
      .readAllByQuery(tenantId, {
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
      if (result.status === OCPP2_0_1.SetMonitoringStatusEnumType.Accepted && result.id) {
        await this.updateByKey(
          tenantId,
          {
            id: result.id,
          },
          savedVariableMonitoring.get('databaseId').toString(),
        );
      }

      return await this.readAllByQuery(tenantId, {
        where: { databaseId: savedVariableMonitoring.get('databaseId') },
      }).then((variableMonitorings) => variableMonitorings[0]);
    } else {
      throw new Error(`Unable to update set monitoring result: ${result}`);
    }
  }
}
