// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP2_0_1, BootstrapConfig } from '@citrineos/base';
import { SecurityEvent } from '../model/SecurityEvent';
import { SequelizeRepository } from './Base';
import { Op } from 'sequelize';
import { type ISecurityEventRepository } from '../../../interfaces/repositories';
import { Sequelize } from 'sequelize-typescript';
import { Logger, ILogObj } from 'tslog';

export class SequelizeSecurityEventRepository
  extends SequelizeRepository<SecurityEvent>
  implements ISecurityEventRepository
{
  constructor(config: BootstrapConfig, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize) {
    super(config, SecurityEvent.MODEL_NAME, logger, sequelizeInstance);
  }

  async createByStationId(
    tenantId: number,
    value: OCPP2_0_1.SecurityEventNotificationRequest,
    stationId: string,
  ): Promise<SecurityEvent> {
    return await this.create(
      tenantId,
      SecurityEvent.build({
        tenantId,
        stationId,
        ...value,
      }),
    );
  }

  async readByStationIdAndTimestamps(
    tenantId: number,
    stationId: string,
    from?: Date,
    to?: Date,
  ): Promise<SecurityEvent[]> {
    const timestampQuery = this.generateTimestampQuery(from?.toISOString(), to?.toISOString());
    return await this.readAllByQuery(tenantId, {
      where: {
        stationId,
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
