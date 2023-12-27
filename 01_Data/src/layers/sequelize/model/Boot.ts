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

import { BootConfig, CustomDataType, Namespace, RegistrationStatusEnumType, SetVariableResultType, StatusInfoType } from "@citrineos/base";
import { Column, DataType, HasMany, Model, PrimaryKey, Table } from "sequelize-typescript";
import { VariableAttribute } from "./DeviceModel";

@Table
export class Boot extends Model implements BootConfig {

    static readonly MODEL_NAME: string = Namespace.BootConfig;

    declare customData?: CustomDataType;

    /**
     * StationId
     */
    @PrimaryKey
    @Column(DataType.STRING)
    declare id: string;

    @Column(DataType.STRING)
    declare lastBootTime?: string;

    @Column(DataType.INTEGER)
    declare heartbeatInterval?: number;

    @Column(DataType.INTEGER)
    declare bootRetryInterval?: number;

    @Column(DataType.STRING)
    declare status: RegistrationStatusEnumType;

    @Column(DataType.JSON)
    declare statusInfo?: StatusInfoType;

    @Column(DataType.BOOLEAN)
    declare getBaseReportOnPending?: boolean;
    /**
     * Variable attributes to be sent in SetVariablesRequest on pending boot 
     */
    @HasMany(() => VariableAttribute)
    declare pendingBootSetVariables?: VariableAttribute[];

    @Column(DataType.JSON)
    declare variablesRejectedOnLastBoot: SetVariableResultType[];

    @Column(DataType.BOOLEAN)
    declare bootWithRejectedVariables?: boolean;
}