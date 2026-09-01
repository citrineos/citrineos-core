// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  DeleteCertificateAttemptCreate,
  DeleteCertificateAttemptDto,
  DeleteCertificateStatusEnumType,
} from '@citrineos/types';
import { SequelizeRepository, type SequelizeRepositoryDependencies } from './Base.js';
import { DeleteCertificateAttempt } from '../../models/Certificate/DeleteCertificateAttempt.js';
import { ChargingStation } from '../../models/Location/index.js';
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
    return await this.readOnlyOneByQuery(tenantId, {
      where: {
        ocppConnectionName,
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
    return await this.readOnlyOneByQuery(tenantId, {
      where: {
        ocppConnectionName,
        status: null,
      },
    });
  }

  async createAttempt(
    tenantId: number,
    input: DeleteCertificateAttemptCreate,
  ): Promise<DeleteCertificateAttemptDto> {
    const stationId =
      input.stationId ?? (await this.resolveStationId(tenantId, input.ocppConnectionName));
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

  private async resolveStationId(
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<number | null> {
    const station = await ChargingStation.findOne({
      where: { ocppConnectionName, tenantId },
      attributes: ['id'],
    });
    return station?.id ?? null;
  }
}

export default SequelizeDeleteCertificateAttemptRepository;
