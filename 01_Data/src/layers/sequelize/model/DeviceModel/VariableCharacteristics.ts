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

  @Column(DataType.INTEGER)
  declare minLimit?: number;

  @Column(DataType.INTEGER)
  declare maxLimit?: number;

  @Column(DataType.STRING)
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