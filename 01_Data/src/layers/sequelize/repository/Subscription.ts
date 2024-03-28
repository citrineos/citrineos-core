// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { SequelizeRepository, Subscription } from "..";
import { ISubscriptionRepository } from "../../..";


export class SubscriptionRepository extends SequelizeRepository<Subscription> implements ISubscriptionRepository {
    
    readAllByStationId(stationId: string): Promise<Subscription[]> {
        return super.readAllByQuery({ where: { stationId: stationId } }, Subscription.MODEL_NAME);
    }

    deleteByKey(key: string): Promise<boolean> {
        return super.deleteByKey(key, Subscription.MODEL_NAME);
    }
}