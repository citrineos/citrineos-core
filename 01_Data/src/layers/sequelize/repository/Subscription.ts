// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Sequelize } from 'sequelize-typescript';
import { SequelizeRepository, Subscription } from '..';
import { ISubscriptionRepository } from '../../..';
import { SystemConfig } from '@citrineos/base';
import { Logger, ILogObj } from 'tslog';

export class SequelizeSubscriptionRepository extends SequelizeRepository<Subscription> implements ISubscriptionRepository {
  constructor(config: SystemConfig, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize) {
    super(config, Subscription.MODEL_NAME, logger, sequelizeInstance);
  }

  /**
   * Creates a new {@link Subscription} in the database.
   * Input is assumed to not have an id, and id will be removed if present.
   * Object is rebuilt to ensure access to essential {@link Model} function {@link Model.save()} (Model is extended by Subscription).
   *
   * @param value {@link Subscription} object which may have been deserialized from JSON
   * @returns Saved {@link Subscription} if successful, undefined otherwise
   */
  create(value: Subscription): Promise<Subscription> {
    const { ...rawSubscription } = value;
    rawSubscription.id = null;
    return super.create(Subscription.build({ ...rawSubscription }));
  }

  readAllByStationId(stationId: string): Promise<Subscription[]> {
    return super.readAllByQuery({ where: { stationId: stationId } });
  }

  deleteByKey(key: string): Promise<Subscription | undefined> {
    return super.deleteByKey(key);
  }
}
