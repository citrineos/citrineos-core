// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { SequelizeRepository } from './Base';
import { ICertificateRepository } from '../../../interfaces';
import { Certificate } from '../model/Certificate';
import { SystemConfig } from '@citrineos/base';
import { Sequelize } from 'sequelize-typescript';
import { ILogObj, Logger } from 'tslog';

export class SequelizeCertificateRepository extends SequelizeRepository<Certificate> implements ICertificateRepository {
  constructor(config: SystemConfig, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize) {
    super(config, Certificate.MODEL_NAME, logger, sequelizeInstance);
  }

  async createOrUpdateCertificate(certificate: Certificate): Promise<Certificate> {
    return await this.s.transaction(async (transaction) => {
      const savedCert = await this.s.models[Certificate.MODEL_NAME].findOne({
        where: {
          serialNumber: certificate.serialNumber,
          issuerName: certificate.issuerName,
        },
        transaction,
      });
      if (!savedCert) {
        return await this.create(certificate);
      } else {
        return (
          await this.updateAllByQuery(certificate, {
            where: {
              serialNumber: certificate.serialNumber,
              issuerName: certificate.issuerName,
            },
            transaction,
          })
        )[0];
      }
    });
  }
}
