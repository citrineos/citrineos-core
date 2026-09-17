// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { SequelizeRepository, type SequelizeRepositoryDependencies } from './base.js';
import { resolveStationId, resolveStationIdOrThrow } from './resolve-station-id.js';
import { ChargingStationSecurityInfo } from '../../models/charging-station-security-info.js';
import type { IChargingStationSecurityInfoRepository } from '../repositories.js';

export class SequelizeChargingStationSecurityInfoRepository
  extends SequelizeRepository<ChargingStationSecurityInfo>
  implements IChargingStationSecurityInfoRepository
{
  constructor({ config, logger, sequelizeInstance }: SequelizeRepositoryDependencies) {
    super({ config, namespace: ChargingStationSecurityInfo.MODEL_NAME, logger, sequelizeInstance });
  }

  async readChargingStationPublicKeyFileId(
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<string> {
    const stationId = await resolveStationId(tenantId, ocppConnectionName);
    if (stationId === undefined) {
      return '';
    }

    const existingInfo = await this.readOnlyOneByQuery(tenantId, {
      where: { stationId },
    });
    return existingInfo ? existingInfo.publicKeyFileId : '';
  }

  async readOrCreateChargingStationInfo(
    tenantId: number,
    ocppConnectionName: string,
    publicKeyFileId: string,
  ): Promise<void> {
    const stationId = await resolveStationIdOrThrow(
      tenantId,
      ocppConnectionName,
      'store security info',
    );

    await this.readOrCreateByQuery(tenantId, {
      where: {
        tenantId,
        stationId,
      },
      defaults: {
        publicKeyFileId,
      },
    });
  }
}

export default SequelizeChargingStationSecurityInfoRepository;
