// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  CertificateDto,
  CertificateUseEnumType,
  HashAlgorithmEnumType,
  InstalledCertificateCreate,
  InstalledCertificateDto,
} from '@citrineos/types';
import { SequelizeRepository, type SequelizeRepositoryDependencies } from './base.js';
import type { IInstalledCertificateRepository } from '../repositories.js';
import { InstalledCertificate } from '../../models/certificate/installed-certificate.js';
import { ChargingStation } from '../../models/location/index.js';

type InstalledCertificateHashData = Pick<
  InstalledCertificateDto,
  'hashAlgorithm' | 'issuerNameHash' | 'issuerKeyHash' | 'serialNumber'
>;
type InstalledCertificateCreateInput = Omit<InstalledCertificateCreate, 'hashAlgorithm'> & {
  hashAlgorithm?: HashAlgorithmEnumType;
  certificateId?: number | null;
};

export class SequelizeInstalledCertificateRepository
  extends SequelizeRepository<InstalledCertificate>
  implements IInstalledCertificateRepository
{
  constructor({ config, logger, sequelizeInstance }: SequelizeRepositoryDependencies) {
    super({ config, namespace: InstalledCertificate.MODEL_NAME, logger, sequelizeInstance });
  }

  async findByStationAndType(
    tenantId: number,
    ocppConnectionName: string,
    certificateType: CertificateUseEnumType,
  ): Promise<InstalledCertificateDto | undefined> {
    return await this.readOnlyOneByQuery(tenantId, {
      where: { ocppConnectionName, certificateType },
    });
  }

  async findByIdAndStation(
    tenantId: number,
    id: number,
    ocppConnectionName: string,
  ): Promise<InstalledCertificateDto | undefined> {
    return await this.readOnlyOneByQuery(tenantId, {
      where: { id, ocppConnectionName },
    });
  }

  async getLinkedCertificate(
    tenantId: number,
    installedCertificateId: number,
  ): Promise<CertificateDto | undefined> {
    const installed = await this.readByKey(tenantId, installedCertificateId);
    if (!installed) {
      return undefined;
    }
    return (await installed.$get('certificate')) ?? undefined;
  }

  async createInstalledCertificate(
    tenantId: number,
    input: InstalledCertificateCreateInput,
  ): Promise<InstalledCertificateDto> {
    const stationId = await this.resolveStationId(tenantId, input.ocppConnectionName);
    const installed = InstalledCertificate.build({ ...input, stationId, tenantId });
    const saved = await installed.save();
    this.emit('created', [saved]);
    return saved;
  }

  async setCertificateId(
    tenantId: number,
    id: number,
    certificateId: number,
  ): Promise<InstalledCertificateDto | undefined> {
    return await this.updateByKey(tenantId, { certificateId }, id.toString());
  }

  async updateHashData(
    tenantId: number,
    id: number,
    hashData: InstalledCertificateHashData,
  ): Promise<InstalledCertificateDto | undefined> {
    return await this.updateByKey(
      tenantId,
      {
        hashAlgorithm: hashData.hashAlgorithm,
        issuerNameHash: hashData.issuerNameHash,
        issuerKeyHash: hashData.issuerKeyHash,
        serialNumber: hashData.serialNumber,
      },
      id.toString(),
    );
  }

  async findAllByStation(
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<InstalledCertificateDto[]> {
    return await this.readAllByQuery(tenantId, { where: { ocppConnectionName } });
  }

  async deleteById(tenantId: number, id: number): Promise<InstalledCertificateDto | undefined> {
    return await this.deleteByKey(tenantId, id.toString());
  }

  async deleteByStation(
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<InstalledCertificateDto[]> {
    return await this.deleteAllByQuery(tenantId, { where: { ocppConnectionName } });
  }

  async deleteByStationAndType(
    tenantId: number,
    ocppConnectionName: string,
    certificateType: CertificateUseEnumType,
  ): Promise<InstalledCertificateDto[]> {
    return await this.deleteAllByQuery(tenantId, {
      where: { ocppConnectionName, certificateType },
    });
  }

  async deleteByStationAndHashData(
    tenantId: number,
    ocppConnectionName: string,
    hashData: InstalledCertificateHashData,
  ): Promise<InstalledCertificateDto[]> {
    return await this.deleteAllByQuery(tenantId, {
      where: {
        ocppConnectionName,
        hashAlgorithm: hashData.hashAlgorithm,
        issuerNameHash: hashData.issuerNameHash,
        issuerKeyHash: hashData.issuerKeyHash,
        serialNumber: hashData.serialNumber,
      },
    });
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

export default SequelizeInstalledCertificateRepository;
