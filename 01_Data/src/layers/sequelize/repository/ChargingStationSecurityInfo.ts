import { SequelizeRepository } from './Base';
import { ChargingStationSecurityInfo } from '../model/ChargingStationSecurityInfo';
import { ILogObj, Logger } from 'tslog';
import { Sequelize } from 'sequelize-typescript';
import { SystemConfig } from '@citrineos/base';
import { IChargingStationSecurityInfoRepository } from '../../../interfaces';

export class SequelizeChargingStationSecurityInfoRepository extends SequelizeRepository<ChargingStationSecurityInfo> implements IChargingStationSecurityInfoRepository {
  constructor(config: SystemConfig, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize) {
    super(config, ChargingStationSecurityInfo.MODEL_NAME, logger, sequelizeInstance);
  }

  async readChargingStationPublicKeyFileId(stationId: string): Promise<string> {
    const existingInfo = await this.readOnlyOneByQuery({ where: { stationId } });
    return existingInfo ? existingInfo.publicKeyFileId : '';
  }

  async readOrCreateChargingStationInfo(stationId: string, publicKeyFileId: string): Promise<void> {
    await this.readOrCreateByQuery({
      where: {
        stationId,
      },
      defaults: {
        stationId,
        publicKeyFileId,
      },
    });
  }
}
