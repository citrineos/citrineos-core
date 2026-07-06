// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { ChargingStationSequenceTypeEnumType } from '@citrineos/base';
import type { IChargingStationSequenceRepository } from '../../../interfaces/repositories.js';
import { ChargingStationSequence } from '../model/ChargingStationSequence/ChargingStationSequence.js';
import { SequelizeRepository, type SequelizeRepositoryDependencies } from './Base.js';

export class SequelizeChargingStationSequenceRepository
  extends SequelizeRepository<ChargingStationSequence>
  implements IChargingStationSequenceRepository
{
  private static readonly SEQUENCE_START = 1;

  constructor({ config, logger, sequelizeInstance }: SequelizeRepositoryDependencies) {
    super({ config, namespace: ChargingStationSequence.MODEL_NAME, logger, sequelizeInstance });
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
    ocppConnectionName: string,
    type: ChargingStationSequenceTypeEnumType,
  ): Promise<number> {
    return await this.s.transaction(async (transaction) => {
      const [storedSequence, sequenceCreated] = await this.readOrCreateByQuery(tenantId, {
        where: {
          tenantId: tenantId,
          ocppConnectionName: ocppConnectionName,
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

      return this._ensureNumber(storedSequence.get('value'));
    });
  }
}

export default SequelizeChargingStationSequenceRepository;
