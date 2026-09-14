// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { SequelizeRepository, type SequelizeRepositoryDependencies } from './base.js';
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
    const existingInfo = await this.readOnlyOneByQuery(tenantId, {
      where: { ocppConnectionName: ocppConnectionName },
    });
    return existingInfo ? existingInfo.publicKeyFileId : '';
  }

  async readOrCreateChargingStationInfo(
    tenantId: number,
    ocppConnectionName: string,
    publicKeyFileId: string,
  ): Promise<void> {
    await this.readOrCreateByQuery(tenantId, {
      where: {
        tenantId,
        ocppConnectionName: ocppConnectionName,
      },
      defaults: {
        publicKeyFileId,
      },
    });
  }
}

export default SequelizeChargingStationSecurityInfoRepository;
