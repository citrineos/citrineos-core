// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Namespace } from '@citrineos/base';
import { Column, Index, Model, Table } from 'sequelize-typescript';

@Table
export class Subscription extends Model {
  static readonly MODEL_NAME: string = Namespace.Subscription;

  @Index
  @Column
  declare stationId: string;

  @Column({
    defaultValue: false
  })
  declare onConnect: boolean;

  @Column({
    defaultValue: false
  })
  declare onClose: boolean;

  @Column({
    defaultValue: false
  })
  declare onMessage: boolean;

  @Column({
    defaultValue: false
  })
  declare sentMessage: boolean;

  @Column
  declare messageRegexFilter?: string;

  @Column
  declare url: string;
}
