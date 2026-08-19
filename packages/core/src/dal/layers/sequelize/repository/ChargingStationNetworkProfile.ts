// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Op } from 'sequelize';
import type { IChargingStationNetworkProfileRepository } from '../../../interfaces/repositories.js';
import { ChargingStationNetworkProfile } from '../model/Location/ChargingStationNetworkProfile.js';
import { SequelizeRepository, type SequelizeRepositoryDependencies } from './Base.js';

export class SequelizeChargingStationNetworkProfileRepository
  extends SequelizeRepository<ChargingStationNetworkProfile>
  implements IChargingStationNetworkProfileRepository
{
  constructor({ config, logger, sequelizeInstance }: SequelizeRepositoryDependencies) {
    super({
      config,
      namespace: ChargingStationNetworkProfile.MODEL_NAME,
      logger,
      sequelizeInstance,
    });
  }

  async deleteAllByStationIdAndConfigurationSlots(
    tenantId: number,
    ocppConnectionName: string,
    configurationSlot: number[],
  ): Promise<ChargingStationNetworkProfile[]> {
    return this.deleteAllByQuery(tenantId, {
      where: {
        ocppConnectionName,
        tenantId,
        configurationSlot: { [Op.in]: configurationSlot },
      },
    });
  }
}

export default SequelizeChargingStationNetworkProfileRepository;
