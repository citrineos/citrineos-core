// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP2_0_1, OCPP2_0_1_Namespace } from '@citrineos/base';
import { Column, DataType, Table } from 'sequelize-typescript';
import { BaseModelWithTenant } from '../BaseModelWithTenant';

@Table
export class AdditionalInfo extends BaseModelWithTenant {
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.AdditionalInfoType;

  @Column({
    type: DataType.STRING,
    unique: 'additionalIdToken_type',
  })
  declare additionalIdToken: string;

  @Column({
    type: DataType.STRING,
    unique: 'additionalIdToken_type',
  })
  declare type: string;

  @Column(DataType.JSONB)
  declare customData?: OCPP2_0_1.CustomDataType | null;
}
