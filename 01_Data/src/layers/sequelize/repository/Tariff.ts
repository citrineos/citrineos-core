// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { SequelizeRepository } from './Base';
import { ITariffRepository, TariffQueryString } from '../../../interfaces';
import { Tariff } from '../model/Tariff';

export class SequelizeTariffRepository extends SequelizeRepository<Tariff> implements ITariffRepository {
  async findByStationId(stationId: string): Promise<Tariff | null> {
    return super.readAllByQuery({
      where: {
        stationId: stationId,
      },
    }).then((tariffs) => tariffs.length > 0 ? tariffs[0] : null);
  }

  async createOrUpdateTariff(tariff: Tariff): Promise<Tariff> {
    const [storedTariff, _tariffCreated] = await this.upsert(Tariff.build({
      stationId: tariff.stationId,
      unit: tariff.unit,
      price: tariff.price,
    }));
    return storedTariff;
  }

  async readAllByQuery(query: TariffQueryString): Promise<Tariff[]> {
    return super.readAllByQuery(
      {
        where: {
          ...(query.stationId ? { stationId: query.stationId } : {}),
          ...(query.unit ? { unit: query.unit } : {}),
          ...(query.id ? { id: query.id } : {}),
        },
      }
    );
  }

  async deleteAllByQuery(query: TariffQueryString): Promise<Tariff[]> {
    if (!query.id && !query.stationId && !query.unit) {
      throw new Error('Must specify at least one query parameter');
    }
    return super.deleteAllByQuery(
      {
        where: {
          ...(query.stationId ? { stationId: query.stationId } : {}),
          ...(query.unit ? { unit: query.unit } : {}),
          ...(query.id ? { id: query.id } : {}),
        },
      }
    );
  }
}
