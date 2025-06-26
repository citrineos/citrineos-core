import { SequelizeRepository } from './Base';
import { IChargingStationSequenceRepository } from '../../../interfaces';
import { ChargingStationSequence } from '../model/ChargingStationSequence';
import { ChargingStationSequenceType, BootstrapConfig } from '@citrineos/base';
import { ILogObj, Logger } from 'tslog';
import { Sequelize } from 'sequelize-typescript';

export class SequelizeChargingStationSequenceRepository
  extends SequelizeRepository<ChargingStationSequence>
  implements IChargingStationSequenceRepository
{
  private static readonly SEQUENCE_START = 1;

  constructor(config: BootstrapConfig, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize) {
    super(config, ChargingStationSequence.MODEL_NAME, logger, sequelizeInstance);
  }

  async getNextSequenceValue(
    tenantId: number,
    stationId: string,
    type: ChargingStationSequenceType,
  ): Promise<number> {
    return await this.s.transaction(async (transaction) => {
      const [storedSequence, sequenceCreated] = await this.readOrCreateByQuery(tenantId, {
        where: {
          tenantId: tenantId,
          stationId: stationId,
          type: type,
        },
        defaults: {
          value: SequelizeChargingStationSequenceRepository.SEQUENCE_START,
        },
        transaction,
      });

      if (!sequenceCreated) {
        const updatedSequences = await storedSequence.increment('value', { transaction });
        return updatedSequences.value;
      } else {
        return storedSequence.value;
      }
    });
  }
}
