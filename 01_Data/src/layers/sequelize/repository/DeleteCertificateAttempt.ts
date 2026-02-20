// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { SequelizeRepository } from './Base.js';
import { Sequelize } from 'sequelize-typescript';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { DeleteCertificateAttempt } from '../model/index.js';
import type { IDeleteCertificateAttemptRepository } from '../../../interfaces/index.js';
import type { BootstrapConfig } from '@citrineos/base';

export class SequelizeDeleteCertificateAttemptRepository
  extends SequelizeRepository<DeleteCertificateAttempt>
  implements IDeleteCertificateAttemptRepository
{
  constructor(config: BootstrapConfig, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize) {
    super(config, DeleteCertificateAttempt.MODEL_NAME, logger, sequelizeInstance);
  }
}
