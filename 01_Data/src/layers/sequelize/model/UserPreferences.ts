// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Namespace } from "@citrineos/base";
import { Model } from "sequelize";
import { Column, DataType, PrimaryKey, Table } from "sequelize-typescript";


@Table
export class UserPreferences extends Model {
    static readonly MODEL_NAME: string = Namespace.UserPreferences;

    @PrimaryKey
    @Column(DataType.STRING)
    declare key: string;

    @Column(DataType.JSON)
    declare value: string;
}