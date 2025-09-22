// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { BootstrapConfig } from '@citrineos/base';
import { SequelizeRepository } from './Base.js';
import { Sequelize } from 'sequelize-typescript';
import { ILogObj, Logger } from 'tslog';
import { ServerNetworkProfile } from '../model/index.js';
import { IServerNetworkProfileRepository } from '../../../interfaces/index.js';

export class SequelizeServerNetworkProfileRepository
  extends SequelizeRepository<ServerNetworkProfile>
  implements IServerNetworkProfileRepository
{
  constructor(config: BootstrapConfig, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize) {
    super(config, ServerNetworkProfile.MODEL_NAME, logger, sequelizeInstance);
  }
}
