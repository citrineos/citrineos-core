// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Column, DataType, ForeignKey, Table } from 'sequelize-typescript';
import { AdditionalInfo } from './AdditionalInfo';
import { BaseModelWithTenant } from '../BaseModelWithTenant';

@Table
export class IdTokenAdditionalInfo extends BaseModelWithTenant {
  // Namespace enum not used as this is not a model required by CitrineOS
  static readonly MODEL_NAME: string = 'IdTokenAdditionalInfo';

  @ForeignKey(() => AdditionalInfo)
  @Column(DataType.INTEGER)
  declare additionalInfoId: number;

  // This join table is no longer needed, but kept for migration compatibility if required.
  // You may safely remove this file if not referenced elsewhere.
}
