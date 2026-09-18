// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  CertificateDto,
  CertificateUseEnumType,
  InstallCertificateAttemptCreate,
  InstallCertificateAttemptDto,
  InstallCertificateStatusEnumType,
} from '@citrineos/types';
import { SequelizeRepository, type SequelizeRepositoryDependencies } from './base.js';
import { resolveStationId, resolveStationIdOrThrow } from './resolve-station-id.js';
import type { IInstallCertificateAttemptRepository } from '../repositories.js';
import { InstallCertificateAttempt } from '../../models/certificate/install-certificate-attempt.js';
import { Certificate } from '../../models/certificate/certificate.js';

export class SequelizeInstallCertificateAttemptRepository
  extends SequelizeRepository<InstallCertificateAttempt>
  implements IInstallCertificateAttemptRepository
{
  constructor({ config, logger, sequelizeInstance }: SequelizeRepositoryDependencies) {
    super({ config, namespace: InstallCertificateAttempt.MODEL_NAME, logger, sequelizeInstance });
  }

  async findPendingByStationTypeAndCertHash(
    tenantId: number,
    ocppConnectionName: string,
    certificateType: CertificateUseEnumType,
    certificateFileHash: string,
    requestId?: number | null,
  ): Promise<InstallCertificateAttemptDto | undefined> {
    const stationId = await resolveStationId(tenantId, ocppConnectionName);
    if (stationId === undefined) {
      return undefined;
    }
    return await this.readOnlyOneByQuery(tenantId, {
      where: {
        stationId,
        certificateType,
        status: null,
        ...(requestId != null ? { requestId } : {}),
      },
      include: [
        {
          model: Certificate,
          where: {
            certificateFileHash,
          },
        },
      ],
    });
  }

  async findPendingByStation(
    tenantId: number,
    ocppConnectionName: string,
    requestId?: number | null,
    certificateType?: CertificateUseEnumType,
  ): Promise<InstallCertificateAttemptDto | undefined> {
    const stationId = await resolveStationId(tenantId, ocppConnectionName);
    if (stationId === undefined) {
      return undefined;
    }
    return await this.readOnlyOneByQuery(tenantId, {
      where: {
        stationId,
        status: null,
        ...(requestId != null ? { requestId } : {}),
        ...(certificateType != null ? { certificateType } : {}),
      },
    });
  }

  async createAttempt(
    tenantId: number,
    ocppConnectionName: string,
    input: Omit<InstallCertificateAttemptCreate, 'stationId'>,
  ): Promise<InstallCertificateAttemptDto> {
    const stationId = await resolveStationIdOrThrow(
      tenantId,
      ocppConnectionName,
      'record an install-certificate attempt',
    );
    const attempt = InstallCertificateAttempt.build({ ...input, stationId, tenantId });
    const saved = await attempt.save();
    this.emit('created', [saved]);
    return saved;
  }

  async updateStatus(
    tenantId: number,
    id: number,
    status: InstallCertificateStatusEnumType,
  ): Promise<InstallCertificateAttemptDto | undefined> {
    return await this.updateByKey(tenantId, { status }, id.toString());
  }

  async getLinkedCertificate(
    tenantId: number,
    attemptId: number,
  ): Promise<CertificateDto | undefined> {
    const attempt = await this.readByKey(tenantId, attemptId);
    if (!attempt) {
      return undefined;
    }
    return (await attempt.$get('certificate')) ?? undefined;
  }
}

export default SequelizeInstallCertificateAttemptRepository;
