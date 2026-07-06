// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { SequelizeRepository, type SequelizeRepositoryDependencies } from './Base.js';
import type { IInstalledCertificateRepository } from '../../../interfaces/repositories.js';
import { InstalledCertificate } from '../model/Certificate/InstalledCertificate.js';

export class SequelizeInstalledCertificateRepository
  extends SequelizeRepository<InstalledCertificate>
  implements IInstalledCertificateRepository
{
  constructor({ config, logger, sequelizeInstance }: SequelizeRepositoryDependencies) {
    super({ config, namespace: InstalledCertificate.MODEL_NAME, logger, sequelizeInstance });
  }
}

export default SequelizeInstalledCertificateRepository;
