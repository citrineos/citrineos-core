// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { SequelizeRepository } from './Base';
import { ICertificateRepository } from '../../../interfaces';
import { Certificate } from '../model/Certificate';
import { SystemConfig } from '@citrineos/base';
import { Sequelize } from 'sequelize-typescript';
import { Logger, ILogObj } from 'tslog';

export class SequelizeCertificateRepository extends SequelizeRepository<Certificate> implements ICertificateRepository {
  constructor(config: SystemConfig, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize) {
    super(config, Certificate.MODEL_NAME, logger, sequelizeInstance);
  }

  async createOrUpdateCertificate(certificate: Certificate): Promise<Certificate> {
    const [storedCert, _certCreated] = await Certificate.upsert({
      signedBy: certificate.signedBy,
      serialNumber: certificate.serialNumber,
      keyLength: certificate.keyLength,
      organizationName: certificate.organizationName,
      commonName: certificate.commonName,
      validBefore: certificate.validBefore,
      signatureAlgorithm: certificate.signatureAlgorithm,
      countryName: certificate.countryName,
      isCA: certificate.isCA,
      pathLen: certificate.pathLen,
      certificateFileId: certificate.certificateFileId,
      privateKeyFileId: certificate.privateKeyFileId,
    });
    return storedCert;
  }
}
