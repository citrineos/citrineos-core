// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { SequelizeRepository } from './Base.js';
import type { IChargingStationSequenceRepository } from '../../../interfaces/index.js';
import { ChargingStationSequence } from '../model/index.js';
import type { BootstrapConfig } from '@citrineos/base';
import { ChargingStationSequenceType } from '@citrineos/base';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
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
