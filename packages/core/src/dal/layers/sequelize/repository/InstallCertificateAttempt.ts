// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { SequelizeRepository, type SequelizeRepositoryDependencies } from './Base.js';
import type { IInstallCertificateAttemptRepository } from '../../../interfaces/repositories.js';
import { InstallCertificateAttempt } from '../model/Certificate/InstallCertificateAttempt.js';

export class SequelizeInstallCertificateAttemptRepository
  extends SequelizeRepository<InstallCertificateAttempt>
  implements IInstallCertificateAttemptRepository
{
  constructor({ config, logger, sequelizeInstance }: SequelizeRepositoryDependencies) {
    super({ config, namespace: InstallCertificateAttempt.MODEL_NAME, logger, sequelizeInstance });
  }
}

export default SequelizeInstallCertificateAttemptRepository;
