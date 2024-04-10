// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { type ComponentType, type CustomDataType, EVSEType, Namespace, type VariableType } from '@citrineos/base';
import { BelongsTo, BelongsToMany, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Evse } from './Evse';
import { Variable } from './Variable';
import { ComponentVariable } from './ComponentVariable';

@Table
export class Component extends Model implements ComponentType {
  static readonly MODEL_NAME: string = Namespace.ComponentType;

  /**
   * Fields
   */

  @Column({
    type: DataType.STRING,
    unique: 'name_instance'
  })
  declare name: string;

  @Column({
    type: DataType.STRING,
    unique: 'name_instance'
  })
  declare instance?: string;

  /**
   * Relations
   */

  @BelongsTo(() => Evse)
  declare evse?: EVSEType;

  @ForeignKey(() => Evse)
  @Column(DataType.INTEGER)
  declare evseDatabaseId?: number;

  @BelongsToMany(() => Variable, () => ComponentVariable)
  declare variables?: VariableType[];

  declare customData?: CustomDataType | undefined;

  // Declare the association methods, to be automatically generated by Sequelize at runtime
  public addVariable!: (variable: Variable) => Promise<void>;
  public getVariables!: () => Promise<Variable[]>;
}
