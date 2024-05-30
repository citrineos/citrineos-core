// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { SequelizeRepository } from './Base';
import { MessageInfo } from '../model/MessageInfo';
import { IMessageInfoRepository } from '../../../interfaces';
import { MessageInfoType, SystemConfig } from '@citrineos/base';
import { Sequelize } from 'sequelize-typescript';
import { Logger, ILogObj } from 'tslog';

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
    const [savedMessageInfo, _messageInfoCreated] = await this.upsert(
      MessageInfo.build({
        stationId: stationId,
        componentId: componentId,
        ...message,
        active: true,
      }),
    );
    return savedMessageInfo;
  }
}
