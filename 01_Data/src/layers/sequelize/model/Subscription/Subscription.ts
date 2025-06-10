// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP2_0_1_Namespace } from '@citrineos/base';
import { Column, DataType, Index, Table } from 'sequelize-typescript';
import { BaseModelWithTenant } from '../BaseModelWithTenant';

@Table
export class Subscription extends BaseModelWithTenant {
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.Subscription;

  @Index
  @Column
  declare stationId: string;

  @Column({
    defaultValue: false,
  })
  declare onConnect: boolean;

  @Column({
    defaultValue: false,
  })
  declare onClose: boolean;

  @Column({
    defaultValue: false,
  })
  declare onMessage: boolean;

  @Column({
    defaultValue: false,
  })
  declare sentMessage: boolean;

  @Column(DataType.STRING)
  declare messageRegexFilter?: string | null;

  @Column
  declare url: string;
}
