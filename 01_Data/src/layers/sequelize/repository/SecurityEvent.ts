/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Copyright (c) 2023 S44, LLC
 */

import { SecurityEventNotificationRequest } from "@citrineos/base";
import { SecurityEvent } from "../model/SecurityEvent";
import { SequelizeRepository } from "./Base";
import { Op } from "sequelize";
import { ISecurityEventRepository } from "../../../interfaces/repositories";

export class SecurityEventRepository extends SequelizeRepository<SecurityEvent> implements ISecurityEventRepository {
 
    async createByStationId(value: SecurityEventNotificationRequest, stationId: string): Promise<SecurityEvent | undefined> {
        return super.create(SecurityEvent.build({
            stationId: stationId,
            ...value
        }));
    }

    readByStationIdAndTimestamps(stationId: string, from?: Date, to?: Date): Promise<SecurityEvent[]> {
        const timestampQuery = this.generateTimestampQuery(from?.toISOString(), to?.toISOString());
        return this.s.models[SecurityEvent.MODEL_NAME].findAll({
            where: {
                stationId: stationId,
                ...timestampQuery
            }
        }).then(row => (row as SecurityEvent[]));
    }

    deleteByKey(key: string): Promise<boolean> {
        return super.deleteByKey(key, SecurityEvent.MODEL_NAME);
    }

    /**
     * Private Methods
     */
    private generateTimestampQuery(from?: string, to?: string): any {
        if (!from && !to) {
            return {};
        }
        if (!from && to) {
            return { timestamp: { [Op.lte]: to } };
        }
        if (from && !to) {
            return { timestamp: { [Op.gte]: from } };
        }
        return { timestamp: { [Op.between]: [from, to] } };
    }
}