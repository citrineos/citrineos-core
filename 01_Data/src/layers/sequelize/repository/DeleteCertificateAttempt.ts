// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { SequelizeRepository } from './Base';
import { SystemConfig } from '@citrineos/base';
import { Sequelize } from 'sequelize-typescript';
import { ILogObj, Logger } from 'tslog';
import { DeleteCertificateAttempt } from '../model/Certificate';
import { IDeleteCertificateAttemptRepository } from '../../../interfaces';

export class SequelizeDeleteCertificateAttemptRepository extends SequelizeRepository<DeleteCertificateAttempt> implements IDeleteCertificateAttemptRepository {
  constructor(config: SystemConfig, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize) {
    super(config, DeleteCertificateAttempt.MODEL_NAME, logger, sequelizeInstance);
  }
}
