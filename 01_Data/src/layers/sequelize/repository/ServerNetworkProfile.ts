// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { BootstrapConfig } from '@citrineos/base';
import { SequelizeRepository } from './Base';
import { Sequelize } from 'sequelize-typescript';
import { ILogObj, Logger } from 'tslog';
import { ServerNetworkProfile } from '../model/Location';
import { IServerNetworkProfileRepository } from '../../../interfaces';

export class SequelizeServerNetworkProfileRepository
  extends SequelizeRepository<ServerNetworkProfile>
  implements IServerNetworkProfileRepository
{
  constructor(config: BootstrapConfig, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize) {
    super(config, ServerNetworkProfile.MODEL_NAME, logger, sequelizeInstance);
  }
}
