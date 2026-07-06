// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { OCPP2_0_1 } from '@citrineos/base';
import { SecurityEvent } from '../model/SecurityEvent.js';
import { SequelizeRepository, type SequelizeRepositoryDependencies } from './Base.js';
import { Op } from 'sequelize';
import type { ISecurityEventRepository } from '../../../interfaces/repositories.js';

export class SequelizeSecurityEventRepository
  extends SequelizeRepository<SecurityEvent>
  implements ISecurityEventRepository
{
  constructor({ config, logger, sequelizeInstance }: SequelizeRepositoryDependencies) {
    super({ config, namespace: SecurityEvent.MODEL_NAME, logger, sequelizeInstance });
  }

  async createByStationId(
    tenantId: number,
    value: OCPP2_0_1.SecurityEventNotificationRequest,
    ocppConnectionName: string,
  ): Promise<SecurityEvent> {
    return await this.create(
      tenantId,
      SecurityEvent.build({
        tenantId,
        ocppConnectionName: ocppConnectionName,
        ...value,
      }),
    );
  }

  async readByStationIdAndTimestamps(
    tenantId: number,
    ocppConnectionName: string,
    from?: Date,
    to?: Date,
  ): Promise<SecurityEvent[]> {
    const timestampQuery = this.generateTimestampQuery(from?.toISOString(), to?.toISOString());
    return await this.readAllByQuery(tenantId, {
      where: {
        ocppConnectionName: ocppConnectionName,
        ...timestampQuery,
      },
    }).then((row) => row as SecurityEvent[]);
  }

  async deleteByKey(tenantId: number, key: string): Promise<SecurityEvent | undefined> {
    return await super.deleteByKey(tenantId, key);
  }

  /**
   * Private Methods
   */
  private generateTimestampQuery(from?: string, to?: string): any {
    if (!from && !to) {
      return {};
    }
    if (!from && to) {
      return { timestamp: { [Op.lte]: to } };
    }
    if (from && !to) {
      return { timestamp: { [Op.gte]: from } };
    }
    return { timestamp: { [Op.between]: [from, to] } };
  }
}

export default SequelizeSecurityEventRepository;
