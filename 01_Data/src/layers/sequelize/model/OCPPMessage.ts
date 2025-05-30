// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Column, DataType, ForeignKey, Index, Table } from 'sequelize-typescript';
import { CallAction, MessageOrigin, Namespace, OCPPVersion } from '@citrineos/base';
import { ChargingStation } from '..';
import { BaseModelWithTenant } from './BaseModelWithTenant';

@Table
export class OCPPMessage extends BaseModelWithTenant {
  static readonly MODEL_NAME: string = Namespace.OCPPMessage;

  @ForeignKey(() => ChargingStation)
  @Index
  @Column(DataType.STRING)
  declare stationId: string;

  @Index
  @Column(DataType.STRING)
  declare correlationId?: string;

  @Column(DataType.STRING)
  declare origin: MessageOrigin;

  @Column(DataType.STRING)
  declare protocol: OCPPVersion;

  @Column(DataType.STRING)
  declare action?: CallAction;

  @Column(DataType.JSONB)
  declare message: any;

  @Column({
    type: DataType.DATE,
    get() {
      return this.getDataValue('timestamp')?.toISOString();
    },
  })
  declare timestamp: string;
}
