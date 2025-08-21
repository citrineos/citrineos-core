// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { BootstrapConfig } from '@citrineos/base';
import { IOCPPMessageRepository } from '../../../interfaces/index.js';
import { SequelizeRepository } from './Base.js';
import { Sequelize } from 'sequelize-typescript';
import { ILogObj, Logger } from 'tslog';
import { OCPPMessage } from '../model/index.js';

export class SequelizeOCPPMessageRepository
  extends SequelizeRepository<OCPPMessage>
  implements IOCPPMessageRepository
{
  constructor(config: BootstrapConfig, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize) {
    super(config, OCPPMessage.MODEL_NAME, logger, sequelizeInstance);
  }
}
