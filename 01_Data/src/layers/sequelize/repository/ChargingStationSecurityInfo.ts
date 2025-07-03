import { SequelizeRepository } from './Base';
import { ChargingStationSecurityInfo } from '../model/ChargingStationSecurityInfo';
import { ILogObj, Logger } from 'tslog';
import { Sequelize } from 'sequelize-typescript';
import { BootstrapConfig } from '@citrineos/base';
import { IChargingStationSecurityInfoRepository } from '../../../interfaces';

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
