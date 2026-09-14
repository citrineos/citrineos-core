// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { CertificateCreate, CertificateDto } from '@citrineos/types';
import { SequelizeRepository, type SequelizeRepositoryDependencies } from './base.js';
import type { ICertificateRepository } from '../repositories.js';
import { Certificate } from '../../models/certificate/certificate.js';

export class SequelizeCertificateRepository
  extends SequelizeRepository<Certificate>
  implements ICertificateRepository
{
  constructor({ config, logger, sequelizeInstance }: SequelizeRepositoryDependencies) {
    super({ config, namespace: Certificate.MODEL_NAME, logger, sequelizeInstance });
  }

  async findByFileHash(tenantId: number, hash: string): Promise<CertificateDto | undefined> {
    return await this.readOnlyOneByQuery(tenantId, {
      where: { certificateFileHash: hash },
    });
  }

  async findById(tenantId: number, id: number): Promise<CertificateDto | undefined> {
    return await this.readOnlyOneByQuery(tenantId, {
      where: { id },
    });
  }

  async createCertificate(tenantId: number, input: CertificateCreate): Promise<CertificateDto> {
    const certificate = Certificate.build({ ...input, tenantId });
    const savedCertificate = await certificate.save();
    this.emit('created', [savedCertificate]);
    return savedCertificate;
  }

  async createOrUpdateCertificate(
    tenantId: number,
    input: CertificateCreate,
  ): Promise<CertificateDto> {
    return await this.s.transaction(async (transaction) => {
      const savedCert = await this.s.models[Certificate.MODEL_NAME].findOne({
        where: {
          serialNumber: input.serialNumber,
          issuerName: input.issuerName,
        },
        transaction,
      });
      if (!savedCert) {
        const certificate = Certificate.build({ ...input, tenantId });
        const savedCertificate = await certificate.save({ transaction });
        this.emit('created', [savedCertificate]);
        return savedCertificate;
      } else {
        return (
          await this.updateAllByQuery(tenantId, { ...input, tenantId } as Partial<Certificate>, {
            where: {
              serialNumber: input.serialNumber,
              issuerName: input.issuerName,
            },
            transaction,
          })
        )[0];
      }
    });
  }
}

export default SequelizeCertificateRepository;
