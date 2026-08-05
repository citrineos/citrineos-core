// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { SetNetworkProfile } from '../model/Location/SetNetworkProfile.js';
import { SequelizeRepository, type SequelizeRepositoryDependencies } from './Base.js';

export class SequelizeSetNetworkProfileRepository extends SequelizeRepository<SetNetworkProfile> {
  constructor({ config, logger, sequelizeInstance }: SequelizeRepositoryDependencies) {
    super({ config, namespace: SetNetworkProfile.MODEL_NAME, logger, sequelizeInstance });
  }

  async createPending(
    values: Parameters<typeof SetNetworkProfile.build>[0],
  ): Promise<SetNetworkProfile> {
    return SetNetworkProfile.build(values).save();
  }
}

export default SequelizeSetNetworkProfileRepository;
