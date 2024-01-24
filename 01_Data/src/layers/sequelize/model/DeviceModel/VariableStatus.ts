// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Namespace, CustomDataType } from "@citrineos/base";
import { StatusInfoType } from "@citrineos/base/lib/ocpp/model/types/SetVariablesResponse";
import { Table, Model, BelongsTo, Column, DataType, ForeignKey } from "sequelize-typescript";
import { VariableAttribute } from "./VariableAttribute";

@Table
export class VariableStatus extends Model {

    static readonly MODEL_NAME: string = Namespace.VariableStatus;

    declare customData?: CustomDataType;

    @Column(DataType.STRING)
    declare value: string;

    @Column(DataType.STRING)
    declare status: string;

    @Column(DataType.JSON)
    declare statusInfo?: StatusInfoType;

    /**
    * Relations
    */

    @BelongsTo(() => VariableAttribute)
    declare variable: VariableAttribute;

    @ForeignKey(() => VariableAttribute)
    @Column(DataType.INTEGER)
    declare variableAttributeId?: number;
}
