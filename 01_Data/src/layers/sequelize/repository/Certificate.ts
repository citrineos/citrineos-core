// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { SequelizeRepository } from './Base';
import { ICertificateRepository } from '../../../interfaces';
import { Certificate } from '../model/Certificate';
import { BootstrapConfig } from '@citrineos/base';
import { Sequelize } from 'sequelize-typescript';
import { ILogObj, Logger } from 'tslog';

export class SequelizeCertificateRepository
  extends SequelizeRepository<Certificate>
  implements ICertificateRepository
{
  constructor(config: BootstrapConfig, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize) {
    super(config, Certificate.MODEL_NAME, logger, sequelizeInstance);
  }

  async createOrUpdateCertificate(
    tenantId: number,
    certificate: Certificate,
  ): Promise<Certificate> {
    certificate.tenantId = tenantId;
    return await this.s.transaction(async (transaction) => {
      const savedCert = await this.s.models[Certificate.MODEL_NAME].findOne({
        where: {
          serialNumber: certificate.serialNumber,
          issuerName: certificate.issuerName,
        },
        transaction,
      });
      if (!savedCert) {
        const savedCertificate = await certificate.save({ transaction });
        this.emit('created', [savedCertificate]);
        return savedCertificate;
      } else {
        return (
          await this.updateAllByQuery(tenantId, certificate, {
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
