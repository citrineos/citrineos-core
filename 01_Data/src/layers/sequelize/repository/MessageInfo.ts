// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { SequelizeRepository } from './Base';
import { MessageInfo } from '../model/MessageInfo';
import { IMessageInfoRepository } from '../../../interfaces';
import { MessageInfoType, SystemConfig } from '@citrineos/base';
import { Sequelize } from 'sequelize-typescript';
import { ILogObj, Logger } from 'tslog';

export class SequelizeMessageInfoRepository extends SequelizeRepository<MessageInfo> implements IMessageInfoRepository {
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

  async createOrUpdateByMessageInfoTypeAndStationId(message: MessageInfoType, stationId: string, componentId?: number): Promise<MessageInfo> {
    return await this.s.transaction(async (transaction) => {
      const messageInfo = MessageInfo.build({
        stationId: stationId,
        componentId: componentId,
        ...message,
        active: true,
      });
      // TODO is this searching correctly?
      const savedMessageInfo = await this.s.models[MessageInfo.MODEL_NAME].findOne({
        where: {
          stationId: stationId,
          componentId: componentId,
          message: message.message,
        },
        transaction: transaction,
      });
      if (savedMessageInfo) {
        await savedMessageInfo.update(messageInfo, { transaction });
        return (await savedMessageInfo.reload({ transaction })) as MessageInfo;
      }
      return await messageInfo.save({ transaction });
    });
  }
}
