// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { SequelizeRepository } from './Base';
import { IInstalledCertificateRepository } from '../../../interfaces';
import { BootstrapConfig } from '@citrineos/base';
import { Sequelize } from 'sequelize-typescript';
import { ILogObj, Logger } from 'tslog';
import { InstalledCertificate } from '../model/Certificate/InstalledCertificate';

export class SequelizeInstalledCertificateRepository
  extends SequelizeRepository<InstalledCertificate>
  implements IInstalledCertificateRepository
{
  constructor(config: BootstrapConfig, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize) {
    super(config, InstalledCertificate.MODEL_NAME, logger, sequelizeInstance);
  }
}
