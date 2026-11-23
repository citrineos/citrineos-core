// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { AuthorizationAttemptCreate } from '@citrineos/types';
import type { IAuthorizationAttemptRepository } from '../repositories.js';
import { AuthorizationAttempt } from '../../models/authorization/authorization-attempt.js';
import { SequelizeRepository, type SequelizeRepositoryDependencies } from './base.js';
import { resolveStationId } from './resolve-station-id.js';

export class SequelizeAuthorizationAttemptRepository
  extends SequelizeRepository<AuthorizationAttempt>
  implements IAuthorizationAttemptRepository
{
  constructor({ config, logger, sequelizeInstance }: SequelizeRepositoryDependencies) {
    super({ config, namespace: AuthorizationAttempt.MODEL_NAME, logger, sequelizeInstance });
  }

  async createAuthorizationAttempt(
    tenantId: number,
    ocppConnectionName: string,
    attempt: Omit<AuthorizationAttemptCreate, 'stationId' | 'tenantId'>,
  ): Promise<AuthorizationAttempt> {
    const stationId = await resolveStationId(tenantId, ocppConnectionName);
    return this.create(
      tenantId,
      AuthorizationAttempt.build({ ...attempt, stationId: stationId ?? null, tenantId }),
    );
  }
}
