// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP2_0_1, OCPP2_0_1_Namespace } from '@citrineos/base';
import { Column, DataType, Index, Table } from 'sequelize-typescript';
import { BaseModelWithTenant } from './BaseModelWithTenant';

@Table
export class SecurityEvent
  extends BaseModelWithTenant
  implements OCPP2_0_1.SecurityEventNotificationRequest
{
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.SecurityEventNotificationRequest;

  /**
   * Fields
   */
  @Index
  @Column
  declare stationId: string;

  @Column
  declare type: string;

  @Column({
    type: DataType.DATE,
    get() {
      return this.getDataValue('timestamp').toISOString();
    },
  })
  declare timestamp: string;

  @Column(DataType.STRING)
  declare techInfo?: string | null;

  declare customData?: OCPP2_0_1.CustomDataType | null;
}
