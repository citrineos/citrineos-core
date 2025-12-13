// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
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

  /**
   * Converts a Sequelize bigint value to a JavaScript number.
   * Sequelize returns PostgreSQL BIGINT columns as strings to avoid precision loss,
   * but OCPP requires numeric types (e.g., requestId in GetChargingProfilesRequest).
   *
   * @param value - The value from Sequelize (may be string or number)
   * @returns A JavaScript number
   */
  private _ensureNumber(value: string | number | null | undefined): number {
    if (value === null || value === undefined) {
      return SequelizeChargingStationSequenceRepository.SEQUENCE_START;
    }
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      if (isNaN(parsed)) {
        return SequelizeChargingStationSequenceRepository.SEQUENCE_START;
      }
      return parsed;
    }
    return Number(value);
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
        await storedSequence.increment('value', { transaction });
        await storedSequence.reload({ transaction });
      }

      return this._ensureNumber(storedSequence.value);
    });
  }
}
