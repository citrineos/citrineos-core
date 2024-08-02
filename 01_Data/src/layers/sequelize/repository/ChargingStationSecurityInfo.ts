import { SequelizeRepository } from './Base';
import { ChargingStationSecurityInfo } from '../model/ChargingStationSecurityInfo';
import { ILogObj, Logger } from 'tslog';
import { Sequelize } from 'sequelize-typescript';
import { SystemConfig } from '@citrineos/base';

// TODO consolidate into another repository, potentially
export class SequelizeChargingStationSecurityInfoRepository extends SequelizeRepository<ChargingStationSecurityInfo> {
  constructor(config: SystemConfig, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize) {
    super(config, ChargingStationSecurityInfo.MODEL_NAME, logger, sequelizeInstance);
  }

  async readChargingStationPublicKeyFileName(stationId: string): Promise<string> {
    const existingInfo = await this.readByKey(stationId);
    return existingInfo ? existingInfo.publicKeyFileName : '';
  }

  async readOrCreateChargingStationInfo(stationId: string, publicKeyFileName: string): Promise<void> {
    await this.readOrCreateByQuery({
      where: {
        stationId,
      },
      defaults: {
        stationId,
        publicKeyFileName,
      },
    });
  }
}
