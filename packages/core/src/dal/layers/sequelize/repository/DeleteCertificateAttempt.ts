// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { SequelizeRepository, type SequelizeRepositoryDependencies } from './Base.js';
import { DeleteCertificateAttempt } from '../model/Certificate/DeleteCertificateAttempt.js';
import type { IDeleteCertificateAttemptRepository } from '../../../interfaces/repositories.js';

export class SequelizeDeleteCertificateAttemptRepository
  extends SequelizeRepository<DeleteCertificateAttempt>
  implements IDeleteCertificateAttemptRepository
{
  constructor({ config, logger, sequelizeInstance }: SequelizeRepositoryDependencies) {
    super({ config, namespace: DeleteCertificateAttempt.MODEL_NAME, logger, sequelizeInstance });
  }
}

export default SequelizeDeleteCertificateAttemptRepository;
