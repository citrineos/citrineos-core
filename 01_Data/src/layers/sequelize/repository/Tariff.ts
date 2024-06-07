// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { SequelizeRepository } from './Base';
import { ITariffRepository, TariffQueryString } from '../../../interfaces';
import { Tariff } from '../model/Tariff';
import { Sequelize } from 'sequelize-typescript';
import { SystemConfig } from '@citrineos/base';
import { ILogObj, Logger } from 'tslog';

export class SequelizeTariffRepository extends SequelizeRepository<Tariff> implements ITariffRepository {
  constructor(config: SystemConfig, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize) {
    super(config, Tariff.MODEL_NAME, logger, sequelizeInstance);
  }

  async findByStationId(stationId: string): Promise<Tariff | undefined> {
    return super.readOnlyOneByQuery({
      where: {
        stationId: stationId,
      },
    });
  }

  async createOrUpdateTariff(tariff: Tariff): Promise<Tariff> {
    // TODO check if searchg correclty
    return await this.s.transaction(async (transaction) => {
      const savedTariff = await this.s.models[Tariff.MODEL_NAME].findOne({
        where: {
          stationId: tariff.stationId,
          unit: tariff.unit,
        },
        transaction,
      });
      if (savedTariff) {
        return (await this.updateByKey({ ...tariff }, savedTariff.dataValues.id)) as Tariff;
      }
      return await this.create(tariff);
    });
  }

  async readAllByQuerystring(query: TariffQueryString): Promise<Tariff[]> {
    return super.readAllByQuery({
      where: {
        ...(query.stationId ? { stationId: query.stationId } : {}),
        ...(query.unit ? { unit: query.unit } : {}),
        ...(query.id ? { id: query.id } : {}),
      },
    });
  }

  async deleteAllByQuerystring(query: TariffQueryString): Promise<Tariff[]> {
    if (!query.id && !query.stationId && !query.unit) {
      throw new Error('Must specify at least one query parameter');
    }
    return super.deleteAllByQuery({
      where: {
        ...(query.stationId ? { stationId: query.stationId } : {}),
        ...(query.unit ? { unit: query.unit } : {}),
        ...(query.id ? { id: query.id } : {}),
      },
    });
  }
}
