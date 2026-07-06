// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { SequelizeRepository, type SequelizeRepositoryDependencies } from './Base.js';
import { Subscription } from '../model/Subscription/Subscription.js';
import type { ISubscriptionRepository } from '../../../interfaces/repositories.js';

export class SequelizeSubscriptionRepository
  extends SequelizeRepository<Subscription>
  implements ISubscriptionRepository
{
  constructor({ config, logger, sequelizeInstance }: SequelizeRepositoryDependencies) {
    super({ config, namespace: Subscription.MODEL_NAME, logger, sequelizeInstance });
  }

  /**
   * Creates a new {@link Subscription} in the database.
   * Input is assumed to not have an id, and id will be removed if present.
   * Object is rebuilt to ensure access to essential {@link Model} function {@link Model.save()} (Model is extended by Subscription).
   *
   * @param value {@link Subscription} object which may have been deserialized from JSON
   * @returns Saved {@link Subscription} if successful, undefined otherwise
   */
  create(tenantId: number, value: Subscription): Promise<Subscription> {
    const { ...rawSubscription } = value;
    rawSubscription.tenantId = tenantId;
    rawSubscription.id = null;
    return super.create(tenantId, Subscription.build({ ...rawSubscription }));
  }

  readAllByStationId(tenantId: number, ocppConnectionName: string): Promise<Subscription[]> {
    return super.readAllByQuery(tenantId, { where: { ocppConnectionName: ocppConnectionName } });
  }

  deleteByKey(tenantId: number, key: string): Promise<Subscription | undefined> {
    return super.deleteByKey(tenantId, key);
  }
}

export default SequelizeSubscriptionRepository;
