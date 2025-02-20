// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { SequelizeRepository } from './Base';
import { MessageInfo } from '../model/MessageInfo';
import { IMessageInfoRepository } from '../../../interfaces';
import { OCPP2_0_1, SystemConfig } from '@citrineos/base';
import { Sequelize } from 'sequelize-typescript';
import { ILogObj, Logger } from 'tslog';

export class SequelizeMessageInfoRepository
  extends SequelizeRepository<MessageInfo>
  implements IMessageInfoRepository
{
  constructor(config: SystemConfig, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize) {
    super(config, MessageInfo.MODEL_NAME, logger, sequelizeInstance);
  }

  async deactivateAllByStationId(stationId: string): Promise<void> {
    await this.updateAllByQuery(
      {
        active: false,
      },
      {
        where: {
          stationId: stationId,
          active: true,
        },
        returning: false,
      },
    );
  }

  async createOrUpdateByMessageInfoTypeAndStationId(
    message: OCPP2_0_1.MessageInfoType,
    stationId: string,
    componentId?: number,
  ): Promise<MessageInfo> {
    return await this.s.transaction(async (transaction) => {
      const savedMessageInfo = await this.s.models[MessageInfo.MODEL_NAME].findOne({
        where: {
          stationId: stationId,
          id: message.id,
        },
        transaction: transaction,
      });

      const messageInfo = {
        stationId: stationId,
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
