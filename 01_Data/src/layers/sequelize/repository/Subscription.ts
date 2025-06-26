// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Sequelize } from 'sequelize-typescript';
import { SequelizeRepository, Subscription } from '..';
import { ISubscriptionRepository } from '../../..';
import { BootstrapConfig } from '@citrineos/base';
import { Logger, ILogObj } from 'tslog';

export class SequelizeSubscriptionRepository
  extends SequelizeRepository<Subscription>
  implements ISubscriptionRepository
{
  constructor(config: BootstrapConfig, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize) {
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
  create(tenantId: number, value: Subscription): Promise<Subscription> {
    const { ...rawSubscription } = value;
    rawSubscription.tenantId = tenantId;
    rawSubscription.id = null;
    return super.create(tenantId, Subscription.build({ ...rawSubscription }));
  }

  readAllByStationId(tenantId: number, stationId: string): Promise<Subscription[]> {
    return super.readAllByQuery(tenantId, { where: { stationId: stationId } });
  }

  deleteByKey(tenantId: number, key: string): Promise<Subscription | undefined> {
    return super.deleteByKey(tenantId, key);
  }
}
