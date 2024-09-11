// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Namespace, } from "@citrineos/base";
import { CustomDataType } from "@citrineos/base/src/ocpp/model/types/SendLocalListRequest";
import { BelongsToMany, Column, DataType, Model, Table } from 'sequelize-typescript';
import { LocalListAuthorization } from ".";
import { LocalListVersionAuthorization } from "./LocalListVersionAuthorization";

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