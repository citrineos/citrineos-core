// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Op } from 'sequelize';
import type { IChargingStationNetworkProfileRepository } from '../repositories.js';
import { ChargingStationNetworkProfile } from '../../models/location/charging-station-network-profile.js';
import { ServerNetworkProfile } from '../../models/location/server-network-profile.js';
import { SetNetworkProfile } from '../../models/location/set-network-profile.js';
import { SequelizeRepository, type SequelizeRepositoryDependencies } from './base.js';
import { resolveStationId } from './resolve-station-id.js';

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

  async readAllByOcppConnectionName(
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<ChargingStationNetworkProfile[]> {
    const stationId = await resolveStationId(tenantId, ocppConnectionName);
    if (stationId === undefined) {
      return [];
    }

    return this.readAllByQuery(tenantId, {
      where: { stationId, tenantId },
      include: [SetNetworkProfile, ServerNetworkProfile],
    });
  }

  async deleteAllByStationIdAndConfigurationSlots(
    tenantId: number,
    ocppConnectionName: string,
    configurationSlot: number[],
  ): Promise<ChargingStationNetworkProfile[]> {
    const stationId = await resolveStationId(tenantId, ocppConnectionName);
    if (stationId === undefined) {
      return [];
    }

    return this.deleteAllByQuery(tenantId, {
      where: {
        stationId,
        tenantId,
        configurationSlot: { [Op.in]: configurationSlot },
      },
    });
  }
}

export default SequelizeChargingStationNetworkProfileRepository;
