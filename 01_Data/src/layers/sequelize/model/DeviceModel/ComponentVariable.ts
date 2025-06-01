// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Column, DataType, ForeignKey, Table } from 'sequelize-typescript';
import { Component } from './Component';
import { Variable } from './Variable';
import { BaseModelWithTenant } from '../BaseModelWithTenant';

@Table
export class ComponentVariable extends BaseModelWithTenant {
  // Namespace enum not used as this is not a model required by CitrineOS
  static readonly MODEL_NAME: string = 'ComponentVariable';

  @ForeignKey(() => Component)
  @Column(DataType.INTEGER)
  declare componentId: number;

  @ForeignKey(() => Variable)
  @Column(DataType.INTEGER)
  declare variableId: number;
}
