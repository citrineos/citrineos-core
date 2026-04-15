// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { SequelizeRepository } from './Base.js';
import { ChargingStationSecurityInfo } from '../model/index.js';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { Sequelize } from 'sequelize-typescript';
import type { BootstrapConfig } from '@citrineos/base';
import type { IChargingStationSecurityInfoRepository } from '../../../interfaces/index.js';

export class SequelizeChargingStationSecurityInfoRepository
  extends SequelizeRepository<ChargingStationSecurityInfo>
  implements IChargingStationSecurityInfoRepository
{
  constructor(config: BootstrapConfig, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize) {
    super(config, ChargingStationSecurityInfo.MODEL_NAME, logger, sequelizeInstance);
  }

  async readChargingStationPublicKeyFileId(tenantId: number, stationId: string): Promise<string> {
    const existingInfo = await this.readOnlyOneByQuery(tenantId, { where: { stationId } });
    return existingInfo ? existingInfo.publicKeyFileId : '';
  }

  async readOrCreateChargingStationInfo(
    tenantId: number,
    stationId: string,
    publicKeyFileId: string,
  ): Promise<void> {
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
