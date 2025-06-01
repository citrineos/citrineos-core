// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Column, DataType, ForeignKey, Table } from 'sequelize-typescript';
import { LocalListVersion } from './LocalListVersion';
import { LocalListAuthorization } from './LocalListAuthorization';
import { BaseModelWithTenant } from '../BaseModelWithTenant';

@Table
export class LocalListVersionAuthorization extends BaseModelWithTenant {
  // Namespace enum not used as this is not a model required by CitrineOS
  static readonly MODEL_NAME: string = 'LocalListVersionAuthorization';

  @ForeignKey(() => LocalListVersion)
  @Column(DataType.INTEGER)
  declare localListVersionId: number;

  @ForeignKey(() => LocalListAuthorization)
  @Column(DataType.INTEGER)
  declare authorizationId: number;
}
