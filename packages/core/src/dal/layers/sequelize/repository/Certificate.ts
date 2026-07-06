// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { SequelizeRepository, type SequelizeRepositoryDependencies } from './Base.js';
import type { ICertificateRepository } from '../../../interfaces/repositories.js';
import { Certificate } from '../model/Certificate/Certificate.js';

export class SequelizeCertificateRepository
  extends SequelizeRepository<Certificate>
  implements ICertificateRepository
{
  constructor({ config, logger, sequelizeInstance }: SequelizeRepositoryDependencies) {
    super({ config, namespace: Certificate.MODEL_NAME, logger, sequelizeInstance });
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

export default SequelizeCertificateRepository;
