// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { SystemConfig } from '@citrineos/base';
import { ICallMessageRepository } from '../../../interfaces';
import { SequelizeRepository } from './Base';
import { Sequelize } from 'sequelize-typescript';
import { ILogObj, Logger } from 'tslog';
import { CallMessage } from '../model/CallMessage';

export class SequelizeCallMessageRepository extends SequelizeRepository<CallMessage> implements ICallMessageRepository {

  constructor(
    config: SystemConfig,
    logger?: Logger<ILogObj>,
    namespace = CallMessage.MODEL_NAME,
    sequelizeInstance?: Sequelize,
  ) {
    super(config, namespace, logger, sequelizeInstance);
  }
}
