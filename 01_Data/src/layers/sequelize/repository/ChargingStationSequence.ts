import { SequelizeRepository } from './Base';
import { IChargingStationSequenceRepository } from '../../../interfaces';
import { ChargingStationSequence, ChargingStationSequenceType } from '../model/ChargingStationSequence';
import { SystemConfig } from '@citrineos/base';
import { ILogObj, Logger } from 'tslog';
import { Sequelize } from 'sequelize-typescript';

export class SequelizeChargingStationSequenceRepository extends SequelizeRepository<ChargingStationSequence> implements IChargingStationSequenceRepository {
  private static readonly SEQUENCE_START = 0;

  constructor(config: SystemConfig, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize) {
    super(config, ChargingStationSequence.MODEL_NAME, logger, sequelizeInstance);
  }

  async getNextSequenceValue(stationId: string, type: ChargingStationSequenceType): Promise<number> {
    return await this.s.transaction(async (transaction) => {
      const [results, _] = await this.s.query(
        `
                    UPDATE "ChargingStationSequences"
                    SET "value" = value + 1
                    WHERE "stationId" = :stationId
                      AND "type" = :type RETURNING "value";
                `,
        {
          replacements: { stationId, type },
          type: 'UPDATE',
          transaction,
        },
      );

      if (results?.length === 0) {
        const [insertResults, _] = await this.s.query(
          `
                        INSERT INTO "ChargingStationSequences" ("stationId", "type", "value")
                        VALUES (:stationId, :type, :value) RETURNING "value";
                    `,
          {
            replacements: {
              stationId,
              type,
              value: SequelizeChargingStationSequenceRepository.SEQUENCE_START,
            },
            type: 'INSERT',
            transaction,
          },
        );
        return (insertResults[0] as any)?.value;
      }
      return (results[0] as any)?.value;
    });
  }
}
