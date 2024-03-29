// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { SequelizeRepository, Subscription } from "..";
import { ISubscriptionRepository } from "../../..";
import { Model } from "sequelize-typescript";


export class SubscriptionRepository extends SequelizeRepository<Subscription> implements ISubscriptionRepository {
    
    /**
     * Creates a new {@link Subscription} in the database.
     * Input is assumed to not have an id, and id will be removed if present.
     * Object is rebuilt to ensure access to essential {@link Model} function {@link Model.save()} (Model is extended by Subscription).
     * 
     * @param value {@link Subscription} object which may have been deserialized from JSON
     * @returns Saved {@link Subscription} if successful, undefined otherwise
     */
    create(value: Subscription): Promise<Subscription | undefined> {
        const { id, ...rawSubscription } = value;
        return super.create(Subscription.build({...rawSubscription}));
    }

    readAllByStationId(stationId: string): Promise<Subscription[]> {
        return super.readAllByQuery({ where: { stationId: stationId } }, Subscription.MODEL_NAME);
    }

    deleteByKey(key: string): Promise<boolean> {
        return super.deleteByKey(key, Subscription.MODEL_NAME);
    }
}