// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Namespace } from '@citrineos/base';
import { Column, DataType, Model, Table } from 'sequelize-typescript';
import { CreationOptional } from 'sequelize';

@Table
export class Tariff extends Model implements TariffData {
  static readonly MODEL_NAME: string = Namespace.Tariff;

  @Column({
    type: DataType.STRING,
    unique: true,
  })
  declare stationId: string;

  @Column({
    type: DataType.CHAR(3),
    allowNull: false,
  })
  declare currency: string;

  @Column({
    type: DataType.DECIMAL,
    allowNull: false,
    validate: {
      min: 0,
    },
    get(this: Tariff) {
      return parseFloat(this.getDataValue('pricePerKwh'));
    },
  })
  declare pricePerKwh: number;

  @Column({
    type: DataType.DECIMAL,
    validate: {
      min: 0,
    },
    get(this: Tariff) {
      return parseFloat(this.getDataValue('pricePerMin'));
    },
  })
  declare pricePerMin?: number | null;

  @Column({
    type: DataType.DECIMAL,
    validate: {
      min: 0,
    },
    get(this: Tariff) {
      return parseFloat(this.getDataValue('pricePerSession'));
    },
  })
  declare pricePerSession?: number | null;

  @Column({
    type: DataType.DECIMAL,
    validate: {
      min: 0,
    },
    get(this: Tariff) {
      return parseFloat(this.getDataValue('authorizationAmount'));
    },
  })
  declare authorizationAmount?: number | null;

  @Column({
    type: DataType.DECIMAL,
    validate: {
      min: 0,
    },
    get(this: Tariff) {
      return parseFloat(this.getDataValue('paymentFee'));
    },
  })
  declare paymentFee?: number | null;

  @Column({
    type: DataType.DECIMAL,
    validate: {
      min: 0,
    },
    get(this: Tariff) {
      return parseFloat(this.getDataValue('taxRate'));
    },
  })
  declare taxRate?: number | null;

  declare id: number;
  declare updatedAt: CreationOptional<Date>;

  get data(): TariffData {
    return {
      id: this.id,
      currency: this.currency,
      pricePerKwh: this.pricePerKwh,
      pricePerMin: this.pricePerMin,
      pricePerSession: this.pricePerSession,
      taxRate: this.taxRate,
      authorizationAmount: this.authorizationAmount,
      paymentFee: this.paymentFee,
    };
  }

  public static newInstance(data: TariffData): Tariff {
    return Tariff.build({ ...data });
  }
}

export interface TariffData {
  id: number;
  currency: string;

  pricePerKwh: number;
  pricePerMin?: number | null;
  pricePerSession?: number | null;
  taxRate?: number | null;

  authorizationAmount?: number | null;
  paymentFee?: number | null;
}
