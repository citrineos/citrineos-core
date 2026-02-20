// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { SequelizeRepository } from './Base.js';
import type { IInstallCertificateAttemptRepository } from '../../../interfaces/index.js';
import type { BootstrapConfig } from '@citrineos/base';
import { Sequelize } from 'sequelize-typescript';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { InstallCertificateAttempt } from '../model/index.js';

export class SequelizeInstallCertificateAttemptRepository
  extends SequelizeRepository<InstallCertificateAttempt>
  implements IInstallCertificateAttemptRepository
{
  constructor(config: BootstrapConfig, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize) {
    super(config, InstallCertificateAttempt.MODEL_NAME, logger, sequelizeInstance);
  }
}
