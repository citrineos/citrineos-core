// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Op } from 'sequelize';
import type { ChargingStationNetworkProfileDto } from '@citrineos/types';
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
  ): Promise<ChargingStationNetworkProfileDto[]> {
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
      include: [SetNetworkProfile, ServerNetworkProfile],
    });
  }

  async readAllByStationIdWithProfiles(
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<ChargingStationNetworkProfileDto[]> {
    return this.readAllByOcppConnectionName(tenantId, ocppConnectionName);
  }

  async readByConfigurationSlot(
    tenantId: number,
    ocppConnectionName: string,
    configurationSlot: number,
  ): Promise<ChargingStationNetworkProfileDto | undefined> {
    const stationId = await resolveStationId(tenantId, ocppConnectionName);
    if (stationId === undefined) {
      return undefined;
    }

    const [row] = await this.readAllByQuery(tenantId, {
      where: { stationId, tenantId, configurationSlot },
      include: [SetNetworkProfile, ServerNetworkProfile],
      limit: 1,
    });
    return row;
  }

  async upsertByConfigurationSlot(
    tenantId: number,
    stationId: number,
    configurationSlot: number,
    setNetworkProfileId: number,
    websocketServerConfigId: string,
  ): Promise<ChargingStationNetworkProfileDto> {
    const where = { tenantId, stationId, configurationSlot };
    // The model's primary key is (stationId, websocketServerConfigId), so an instance save
    // never writes a changed websocketServerConfigId; a static update keyed on the slot does.
    return this.s.transaction(async (transaction) => {
      const [updated] = await ChargingStationNetworkProfile.update(
        { setNetworkProfileId, websocketServerConfigId },
        { where, transaction },
      );
      if (updated === 0) {
        await ChargingStationNetworkProfile.create(
          { ...where, setNetworkProfileId, websocketServerConfigId },
          { transaction },
        );
      }
      return ChargingStationNetworkProfile.findOne({
        where,
        include: [SetNetworkProfile, ServerNetworkProfile],
        transaction,
        rejectOnEmpty: true,
      });
    });
  }
}

export default SequelizeChargingStationNetworkProfileRepository;
