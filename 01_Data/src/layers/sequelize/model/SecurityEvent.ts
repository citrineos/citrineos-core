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
import { SecurityEventNotificationRequest, Namespace, CustomDataType } from "@citrineos/base";
import { Model, Index, Column, DataType, Table } from "sequelize-typescript";

@Table
export class SecurityEvent extends Model implements SecurityEventNotificationRequest {

    static readonly MODEL_NAME: string = Namespace.SecurityEventNotificationRequest;
    
    declare customData?: CustomDataType;

    /**
     * Fields
     */
    @Index
    @Column
    declare stationId: string;

    @Column
    declare type: string;

    @Column({
        type: DataType.DATE,
        get() {
            return this.getDataValue('timestamp').toISOString();
        }
    })
    declare timestamp: string;

    @Column(DataType.STRING)
    declare techInfo?: string;
}