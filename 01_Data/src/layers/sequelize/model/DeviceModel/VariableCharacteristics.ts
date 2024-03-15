// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { CustomDataType, DataEnumType, Namespace, VariableCharacteristicsType, VariableType } from "@citrineos/base";
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { Variable } from "./Variable";

@Table
export class VariableCharacteristics extends Model implements VariableCharacteristicsType {

  static readonly MODEL_NAME: string = Namespace.VariableCharacteristicsType;

  declare customData?: CustomDataType;

  /**
  * Fields
  */

  @Column(DataType.STRING)
  declare unit?: string;

  @Column(DataType.STRING)
  declare dataType: DataEnumType;

  @Column(DataType.DECIMAL)
  declare minLimit?: number;

  @Column(DataType.DECIMAL)
  declare maxLimit?: number;

  @Column(DataType.STRING(4000))
  declare valuesList?: string;

  @Column
  declare supportsMonitoring: boolean;

  /**
  * Relations
  */

  @BelongsTo(() => Variable)
  declare variable: VariableType;
  
  @ForeignKey(() => Variable)
  @Column({
    type: DataType.INTEGER,
    unique: true
  })
  declare variableId?: number;
}