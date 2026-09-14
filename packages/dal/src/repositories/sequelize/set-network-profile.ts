// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  ISetNetworkProfileRepository,
  SetNetworkProfileCreationAttributes,
} from '../repositories.js';
import { SetNetworkProfile } from '../../models/location/set-network-profile.js';
import { SequelizeRepository, type SequelizeRepositoryDependencies } from './base.js';
import { resolveStationIdOrThrow } from './resolve-station-id.js';

export class SequelizeSetNetworkProfileRepository
  extends SequelizeRepository<SetNetworkProfile>
  implements ISetNetworkProfileRepository
{
  constructor({ config, logger, sequelizeInstance }: SequelizeRepositoryDependencies) {
    super({ config, namespace: SetNetworkProfile.MODEL_NAME, logger, sequelizeInstance });
  }

  async createPending(
    tenantId: number,
    ocppConnectionName: string,
    values: SetNetworkProfileCreationAttributes,
  ): Promise<SetNetworkProfile> {
    const stationId = await resolveStationIdOrThrow(
      tenantId,
      ocppConnectionName,
      'record a pending SetNetworkProfile',
    );
    return SetNetworkProfile.build({ ...values, stationId, tenantId }).save();
  }
}

export default SequelizeSetNetworkProfileRepository;
