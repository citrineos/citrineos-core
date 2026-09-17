// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  DeleteCertificateAttemptCreate,
  DeleteCertificateAttemptDto,
  DeleteCertificateStatusEnumType,
} from '@citrineos/types';
import { SequelizeRepository, type SequelizeRepositoryDependencies } from './base.js';
import { resolveStationId, resolveStationIdOrThrow } from './resolve-station-id.js';
import { DeleteCertificateAttempt } from '../../models/certificate/delete-certificate-attempt.js';
import type { IDeleteCertificateAttemptRepository } from '../repositories.js';

type DeleteCertificateHashData = Pick<
  DeleteCertificateAttemptDto,
  'hashAlgorithm' | 'issuerNameHash' | 'issuerKeyHash' | 'serialNumber'
>;

export class SequelizeDeleteCertificateAttemptRepository
  extends SequelizeRepository<DeleteCertificateAttempt>
  implements IDeleteCertificateAttemptRepository
{
  constructor({ config, logger, sequelizeInstance }: SequelizeRepositoryDependencies) {
    super({ config, namespace: DeleteCertificateAttempt.MODEL_NAME, logger, sequelizeInstance });
  }

  async findPendingByStationAndHashData(
    tenantId: number,
    ocppConnectionName: string,
    hashData: DeleteCertificateHashData,
  ): Promise<DeleteCertificateAttemptDto | undefined> {
    const stationId = await resolveStationId(tenantId, ocppConnectionName);
    if (stationId === undefined) {
      return undefined;
    }
    return await this.readOnlyOneByQuery(tenantId, {
      where: {
        stationId,
        hashAlgorithm: hashData.hashAlgorithm,
        issuerNameHash: hashData.issuerNameHash,
        issuerKeyHash: hashData.issuerKeyHash,
        serialNumber: hashData.serialNumber,
        status: null,
      },
    });
  }

  async findPendingByStation(
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<DeleteCertificateAttemptDto | undefined> {
    const stationId = await resolveStationId(tenantId, ocppConnectionName);
    if (stationId === undefined) {
      return undefined;
    }
    return await this.readOnlyOneByQuery(tenantId, {
      where: {
        stationId,
        status: null,
      },
    });
  }

  async createAttempt(
    tenantId: number,
    ocppConnectionName: string,
    input: Omit<DeleteCertificateAttemptCreate, 'stationId'>,
  ): Promise<DeleteCertificateAttemptDto> {
    const stationId = await resolveStationIdOrThrow(
      tenantId,
      ocppConnectionName,
      'record a delete-certificate attempt',
    );
    const attempt = DeleteCertificateAttempt.build({ ...input, stationId, tenantId });
    const saved = await attempt.save();
    this.emit('created', [saved]);
    return saved;
  }

  async updateStatus(
    tenantId: number,
    id: number,
    status: DeleteCertificateStatusEnumType,
  ): Promise<DeleteCertificateAttemptDto | undefined> {
    return await this.updateByKey(tenantId, { status }, id.toString());
  }
}

export default SequelizeDeleteCertificateAttemptRepository;
