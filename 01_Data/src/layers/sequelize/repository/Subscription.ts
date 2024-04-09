// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Subscription } from '..'
import { type ISubscriptionRepository, SequelizeRepository } from '../../..'
import { Model } from 'sequelize-typescript'

export class SubscriptionRepository extends SequelizeRepository<Subscription> implements ISubscriptionRepository {
  /**
     * Creates a new {@link Subscription} in the database.
     * Input is assumed to not have an id, and id will be removed if present.
     * Object is rebuilt to ensure access to essential {@link Model} function {@link Model.save()} (Model is extended by Subscription).
     *
     * @param value {@link Subscription} object which may have been deserialized from JSON
     * @returns Saved {@link Subscription} if successful, undefined otherwise
     */
  async create (value: Subscription): Promise<Subscription | undefined> {
    const { id, ...rawSubscription } = value
    return await super.create(Subscription.build({ ...rawSubscription }))
  }

  async readAllByStationId (stationId: string): Promise<Subscription[]> {
    return await super.readAllByQuery({ where: { stationId } }, Subscription.MODEL_NAME)
  }

  async deleteByKey (key: string): Promise<boolean> {
    return await super.deleteByKey(key, Subscription.MODEL_NAME)
  }
}
