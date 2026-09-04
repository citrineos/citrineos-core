// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { SequelizeRepository, type SequelizeRepositoryDependencies } from './base.js';
import type { ITariffRepository } from '../repositories.js';
import type { TariffQueryString } from '../../interfaces/queries/tariff.js';
import type { TariffDto } from '@citrineos/types';
import { Tariff, type TariffData } from '../../models/tariff/tariffs.js';
import { Connector } from '../../models/location/connector.js';

export class SequelizeTariffRepository
  extends SequelizeRepository<Tariff>
  implements ITariffRepository
{
  constructor({ config, logger, sequelizeInstance }: SequelizeRepositoryDependencies) {
    super({ config, namespace: Tariff.MODEL_NAME, logger, sequelizeInstance });
  }

  async findById(tenantId: number, id: number): Promise<TariffDto | undefined> {
    return super.readByKey(tenantId, id);
  }

  async findByConnectorId(tenantId: number, connectorId: number): Promise<TariffDto | undefined> {
    return super.readOnlyOneByQuery(tenantId, {
      include: [
        {
          model: Connector,
          where: { id: connectorId },
          required: true,
        },
      ],
    });
  }

  async upsertTariff(tenantId: number, tariff: TariffDto): Promise<TariffDto> {
    const model = Tariff.newInstance(tariff as TariffData);
    model.tenantId = tenantId;
    return await this.s.transaction(async (transaction) => {
      const savedTariff = await this.readOnlyOneByQuery(tenantId, {
        where: { id: model.id },
        transaction,
      });
      if (savedTariff) {
        const updatedTariff = await savedTariff.set(model.data).save({ transaction });
        this.emit('updated', [updatedTariff]);
        return updatedTariff;
      }
      const createdTariff = await model.save({ transaction });
      this.emit('created', [createdTariff]);
      return createdTariff;
    });
  }

  async upsertTariffByTariffId(tenantId: number, tariff: TariffDto): Promise<TariffDto> {
    const model = Tariff.newInstance(tariff as TariffData);
    model.tenantId = tenantId;
    return await this.s.transaction(async (transaction) => {
      const savedTariff = model.tariffId
        ? await this.readOnlyOneByQuery(tenantId, {
            where: { tariffId: model.tariffId },
            transaction,
          })
        : undefined;
      if (savedTariff) {
        const updatedTariff = await savedTariff.set(model.data).save({ transaction });
        this.emit('updated', [updatedTariff]);
        return updatedTariff;
      }
      const createdTariff = await model.save({ transaction });
      this.emit('created', [createdTariff]);
      return createdTariff;
    });
  }

  async readAllByQuerystring(tenantId: number, query: TariffQueryString): Promise<TariffDto[]> {
    return super.readAllByQuery(tenantId, {
      where: {
        ...(query.id && { id: query.id }),
      },
    });
  }

  async deleteAllByQuerystring(tenantId: number, query: TariffQueryString): Promise<TariffDto[]> {
    if (!query.id) {
      throw new Error('Must specify at least one query parameter');
    }
    return super.deleteAllByQuery(tenantId, {
      where: {
        ...(query.id && { id: query.id }),
      },
    });
  }
}

export default SequelizeTariffRepository;
