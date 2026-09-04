// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { SequelizeRepository, type SequelizeRepositoryDependencies } from './base.js';
import { MessageInfo } from '../../models/message-info/message-info.js';
import type { IMessageInfoRepository } from '../repositories.js';
import { OCPP2_0_1, type MessageInfoDto } from '@citrineos/types';

export class SequelizeMessageInfoRepository
  extends SequelizeRepository<MessageInfo>
  implements IMessageInfoRepository
{
  constructor({ config, logger, sequelizeInstance }: SequelizeRepositoryDependencies) {
    super({ config, namespace: MessageInfo.MODEL_NAME, logger, sequelizeInstance });
  }

  async deactivateAllByStationId(tenantId: number, ocppConnectionName: string): Promise<void> {
    await this.updateAllByQuery(
      tenantId,
      {
        active: false,
      },
      {
        where: {
          ocppConnectionName: ocppConnectionName,
          active: true,
        },
        returning: false,
      },
    );
  }

  async createOrUpdateByMessageInfoTypeAndStationId(
    tenantId: number,
    message: OCPP2_0_1.MessageInfoType,
    ocppConnectionName: string,
    componentId?: number,
  ): Promise<MessageInfoDto> {
    return await this.s.transaction(async (transaction) => {
      const savedMessageInfo = await this.s.models[MessageInfo.MODEL_NAME].findOne({
        where: {
          ocppConnectionName: ocppConnectionName,
          id: message.id,
        },
        transaction: transaction,
      });

      const messageInfo = {
        tenantId: tenantId,
        ocppConnectionName: ocppConnectionName,
        displayComponentId: componentId ?? null,
        id: message.id,
        priority: message.priority,
        state: message.state ?? null,
        startDateTime: message.startDateTime ?? null,
        endDateTime: message.endDateTime ?? null,
        transactionId: message.transactionId ?? null,
        message: message.message,
        active: true,
      };
      if (savedMessageInfo) {
        return (await this.updateByKey(
          tenantId,
          messageInfo,
          savedMessageInfo.dataValues.databaseId,
        )) as MessageInfo;
      }
      const createdMessageInfo = await MessageInfo.create(messageInfo, { transaction });
      this.emit('created', [createdMessageInfo]);
      return createdMessageInfo;
    });
  }
}

export default SequelizeMessageInfoRepository;
