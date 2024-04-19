// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Component } from './Component';
import { Variable } from './Variable';

@Table
export class ComponentVariable extends Model {
  @ForeignKey(() => Component)
  @Column(DataType.INTEGER)
  declare componentId: number;

  @ForeignKey(() => Variable)
  @Column(DataType.INTEGER)
  declare variableId: number;
}
