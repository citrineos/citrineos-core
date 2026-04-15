// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { SequelizeRepository } from './Base.js';
import type { IInstalledCertificateRepository } from '../../../interfaces/index.js';
import type { BootstrapConfig } from '@citrineos/base';
import { Sequelize } from 'sequelize-typescript';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { InstalledCertificate } from '../model/index.js';

export class SequelizeInstalledCertificateRepository
  extends SequelizeRepository<InstalledCertificate>
  implements IInstalledCertificateRepository
{
  constructor(config: BootstrapConfig, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize) {
    super(config, InstalledCertificate.MODEL_NAME, logger, sequelizeInstance);
  }
}
