// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { SendLocalList } from './SendLocalList';
import { Authorization } from '.';
import { LocalListAuthorization } from './LocalListAuthorization';

@Table
export class SendLocalListAuthorization extends Model {
  // Namespace enum not used as this is not a model required by CitrineOS
  static readonly MODEL_NAME: string = 'SendLocalListAuthorization';

  @ForeignKey(() => SendLocalList)
  @Column(DataType.INTEGER)
  declare sendLocalListId: number;

  @ForeignKey(() => LocalListAuthorization)
  @Column(DataType.INTEGER)
  declare authorizationId: number;
}