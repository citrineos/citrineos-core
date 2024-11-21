// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { SequelizeRepository } from './Base';
import { IInstallCertificateAttemptRepository } from '../../../interfaces';
import { SystemConfig } from '@citrineos/base';
import { Sequelize } from 'sequelize-typescript';
import { ILogObj, Logger } from 'tslog';
import { InstallCertificateAttempt } from '../model/Certificate/InstallCertificateAttempt';

export class SequelizeInstallCertificateAttemptRepository extends SequelizeRepository<InstallCertificateAttempt> implements IInstallCertificateAttemptRepository {
  constructor(config: SystemConfig, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize) {
    super(config, InstallCertificateAttempt.MODEL_NAME, logger, sequelizeInstance);
  }
}
