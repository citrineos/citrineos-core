import { SequelizeRepository } from './Base';
import { IChargingStationSequenceRepository } from '../../../interfaces';
import { ChargingStationSequence } from '../model/ChargingStationSequence';
import { ChargingStationSequenceType, SystemConfig } from '@citrineos/base';
import { ILogObj, Logger } from 'tslog';
import { Sequelize } from 'sequelize-typescript';

export class SequelizeChargingStationSequenceRepository extends SequelizeRepository<ChargingStationSequence> implements IChargingStationSequenceRepository {
  private static readonly SEQUENCE_START = 1;

  constructor(config: SystemConfig, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize) {
    super(config, ChargingStationSequence.MODEL_NAME, logger, sequelizeInstance);
  }

  async getNextSequenceValue(stationId: string, type: ChargingStationSequenceType): Promise<number> {
    return await this.s.transaction(async (transaction) => {
      const [storedSequence, sequenceCreated] = await this.readOrCreateByQuery({
        where: {
          stationId: stationId,
          type: type,
        },
        defaults: {
          value: SequelizeChargingStationSequenceRepository.SEQUENCE_START,
        },
        transaction,
      });

      if (!sequenceCreated) {
        // const updatedSequences = await this.updateAllByQuery({value: storedSequence.value + 1}, {
        //   where: {
        //     stationId: stationId,
        //     type: type
        //   },
        //   transaction
        // });
        // return updatedSequences[0].value;
        const updatedSequences = await storedSequence.increment('value', { transaction });
        return updatedSequences.value;
      } else {
        return storedSequence.value;
      }
    });
  }
}
