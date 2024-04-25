// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { SequelizeRepository } from './Base';
import { ICertificateRepository } from '../../../interfaces';
import { Certificate } from '../model/Certificate';

export class CertificateRepository extends SequelizeRepository<Certificate> implements ICertificateRepository {
  async createOrUpdateCertificate(certificate: Certificate): Promise<Certificate> {
    const [storedCert, _certCreated] = await Certificate.upsert({
      stationId: certificate.stationId,
      serialNumber: certificate.serialNumber,
      certificateType: certificate.certificateType,
      keyLength: certificate.keyLength,
      organizationName: certificate.organizationName,
      commonName: certificate.commonName,
      validBefore: certificate.validBefore,
      certificateFileId: certificate.certificateFileId,
      privateKeyFileId: certificate.privateKeyFileId,
    });
    return storedCert;
  }
}
