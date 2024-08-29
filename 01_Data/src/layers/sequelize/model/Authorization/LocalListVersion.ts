// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { AuthorizationData, Namespace, SendLocalListRequest, UpdateEnumType } from "@citrineos/base";
import { CustomDataType } from "@citrineos/base/src/ocpp/model/types/SendLocalListRequest";
import { BelongsTo, BelongsToMany, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import { Authorization } from ".";
import { SendLocalListAuthorization } from "./SendLocalListAuthorization";
import { LocalListVersionAuthorization } from "./LocalListVersionAuthorization";
import { LocalListAuthorization } from "./LocalListAuthorization";



@Table
export class LocalListVersion extends Model {
    static readonly MODEL_NAME: string = Namespace.LocalListVersion;

    @Column({
      unique: true,
    })
    declare stationId: string;
    
    @Column(DataType.DECIMAL)
    declare versionNumber: number;
   
    @BelongsToMany(() => LocalListAuthorization, () => LocalListVersionAuthorization)
    declare localAuthorizationList?: [LocalListAuthorization, ...LocalListAuthorization[]] | undefined;

    customData?: CustomDataType | null | undefined;
}