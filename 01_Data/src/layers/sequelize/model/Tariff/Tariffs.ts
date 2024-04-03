// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
    Namespace
} from "@citrineos/base";
import { Table, Model, Column, DataType, Index } from "sequelize-typescript";
import { TariffUnitEnumType } from "./index";

@Table
export class Tariff extends Model {

    static readonly MODEL_NAME: string = Namespace.Tariff;

    /**
     * Fields
     */

    @Index
    @Column(DataType.STRING)
    declare stationId: string;

    @Column(DataType.STRING)
    declare unit: TariffUnitEnumType;

    @Column(DataType.DECIMAL)
    declare price: number;
}