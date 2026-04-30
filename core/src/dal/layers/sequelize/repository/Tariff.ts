// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { SequelizeRepository } from './Base.js';
import type { ITariffRepository } from '../../../interfaces/repositories.js';
import type { TariffQueryString } from '../../../interfaces/queries/Tariff.js';
import { Tariff } from '../model/Tariff/Tariffs.js';
import { Sequelize } from 'sequelize-typescript';
import type { BootstrapConfig } from '@citrineos/base';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { Connector } from '../model/Location/Connector.js';

export class SequelizeTariffRepository
  extends SequelizeRepository<Tariff>
  implements ITariffRepository
{
  constructor(config: BootstrapConfig, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize) {
    super(config, Tariff.MODEL_NAME, logger, sequelizeInstance);
  }

  async findByConnectorId(tenantId: number, connectorId: number): Promise<Tariff | undefined> {
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

  async upsertTariff(tenantId: number, tariff: Tariff): Promise<Tariff> {
    tariff.tenantId = tenantId;
    return await this.s.transaction(async (transaction) => {
      const savedTariff = await this.readOnlyOneByQuery(tenantId, {
        where: { id: tariff.id },
        transaction,
      });
      if (savedTariff) {
        const updatedTariff = await savedTariff.set(tariff.data).save({ transaction });
        this.emit('updated', [updatedTariff]);
        return updatedTariff;
      }
      const createdTariff = await tariff.save({ transaction });
      this.emit('created', [createdTariff]);
      return createdTariff;
    });
  }

  async upsertTariffByTariffId(tenantId: number, tariff: Tariff): Promise<Tariff> {
    tariff.tenantId = tenantId;
    return await this.s.transaction(async (transaction) => {
      const savedTariff = tariff.tariffId
        ? await this.readOnlyOneByQuery(tenantId, {
            where: { tariffId: tariff.tariffId },
            transaction,
          })
        : undefined;
      if (savedTariff) {
        const updatedTariff = await savedTariff.set(tariff.data).save({ transaction });
        this.emit('updated', [updatedTariff]);
        return updatedTariff;
      }
      const createdTariff = await tariff.save({ transaction });
      this.emit('created', [createdTariff]);
      return createdTariff;
    });
  }

  async readAllByQuerystring(tenantId: number, query: TariffQueryString): Promise<Tariff[]> {
    return super.readAllByQuery(tenantId, {
      where: {
        ...(query.id && { id: query.id }),
      },
    });
  }

  async deleteAllByQuerystring(tenantId: number, query: TariffQueryString): Promise<Tariff[]> {
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
