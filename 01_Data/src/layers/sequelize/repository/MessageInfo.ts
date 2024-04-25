// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { SequelizeRepository } from './Base';
import { MessageInfo } from '../model/MessageInfo';
import { IMessageInfoRepository } from '../../../interfaces';
import { MessageInfoType } from '@citrineos/base';

export class MessageInfoRepository extends SequelizeRepository<MessageInfo> implements IMessageInfoRepository {
  async deactivateAllByStationId(stationId: string): Promise<void> {
    await MessageInfo.update(
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
    const [savedMessageInfo, _messageInfoCreated] = await MessageInfo.upsert({
      stationId: stationId,
      componentId: componentId,
      id: message.id,
      priority: message.priority,
      state: message.state,
      startDateTime: message.startDateTime,
      endDateTime: message.endDateTime,
      transactionId: message.transactionId,
      message: message.message,
      active: true,
    });
    return savedMessageInfo;
  }
}
