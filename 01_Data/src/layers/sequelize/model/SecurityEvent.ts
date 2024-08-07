// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { type CustomDataType, Namespace, type SecurityEventNotificationRequest } from '@citrineos/base';
import { Column, DataType, Index, Model, Table } from 'sequelize-typescript';

@Table
export class SecurityEvent extends Model implements SecurityEventNotificationRequest {
  static readonly MODEL_NAME: string = Namespace.SecurityEventNotificationRequest;

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

  declare customData?: CustomDataType | null;
}
