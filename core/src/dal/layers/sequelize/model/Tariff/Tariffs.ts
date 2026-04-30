// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  ConnectorDto,
  TariffEnergyType,
  TariffFixedType,
  TariffTimeType,
  PriceType,
  MessageContentType,
  MeterValueDto,
  TariffDto,
  TenantDto,
  TransactionDto,
} from '@citrineos/base';
import { DEFAULT_TENANT_ID, OCPP2_Namespace } from '@citrineos/base';
import type { CreationOptional } from 'sequelize';
import {
  BeforeCreate,
  BeforeUpdate,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Connector } from '../Location/Connector.js';
import { Tenant } from '../Tenant.js';
import { MeterValue } from '../TransactionEvent/MeterValue.js';
import { Transaction } from '../TransactionEvent/Transaction.js';

@Table
export class Tariff extends Model implements TariffDto {
  static readonly MODEL_NAME: string = OCPP2_Namespace.Tariff;

  @HasMany(() => Connector, 'tariffId')
  declare connectors?: ConnectorDto[];

  @HasMany(() => MeterValue, 'tariffId')
  declare meterValues?: MeterValueDto[];

  @HasMany(() => Transaction, 'tariffId')
  declare transactions?: TransactionDto[];

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

  @Column(DataType.JSONB)
  declare tariffAltText?: object[] | null;

  // OCPP 2.1 TariffType fields

  @Column({
    type: DataType.STRING,
    unique: 'tariffId_tenantId',
  })
  declare tariffId?: string | null;

  @Column({
    type: DataType.DATE,
    get() {
      return this.getDataValue('validFrom')?.toISOString();
    },
  })
  declare validFrom?: string | null;

  @Column(DataType.JSONB)
  declare description?: MessageContentType[] | null;

  @Column(DataType.JSONB)
  declare energy?: TariffEnergyType | null;

  @Column(DataType.JSONB)
  declare chargingTime?: TariffTimeType | null;

  @Column(DataType.JSONB)
  declare idleTime?: TariffTimeType | null;

  @Column(DataType.JSONB)
  declare fixedFee?: TariffFixedType | null;

  @Column(DataType.JSONB)
  declare reservationTime?: TariffTimeType | null;

  @Column(DataType.JSONB)
  declare reservationFixed?: TariffFixedType | null;

  @Column(DataType.JSONB)
  declare minCost?: PriceType | null;

  @Column(DataType.JSONB)
  declare maxCost?: PriceType | null;

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
      tariffId: this.tariffId,
      validFrom: this.validFrom,
      description: this.description,
      energy: this.energy,
      chargingTime: this.chargingTime,
      idleTime: this.idleTime,
      fixedFee: this.fixedFee,
      reservationTime: this.reservationTime,
      reservationFixed: this.reservationFixed,
      minCost: this.minCost,
      maxCost: this.maxCost,
    };
  }

  public static newInstance(data: TariffData): Tariff {
    return Tariff.build({ ...data });
  }

  @ForeignKey(() => Tenant)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
    unique: 'tariffId_tenantId',
  })
  declare tenantId: number;

  @BelongsTo(() => Tenant, 'tenantId')
  declare tenant?: TenantDto;

  @BeforeUpdate
  @BeforeCreate
  static setDefaultTenant(instance: Tariff) {
    if (instance.tenantId == null) {
      instance.tenantId = DEFAULT_TENANT_ID;
    }
  }

  constructor(...args: any[]) {
    super(...args);
    if (this.tenantId == null) {
      this.tenantId = DEFAULT_TENANT_ID;
    }
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

  // OCPP 2.1 TariffType fields
  tariffId?: string | null;
  validFrom?: string | null;
  description?: MessageContentType[] | null;
  energy?: TariffEnergyType | null;
  chargingTime?: TariffTimeType | null;
  idleTime?: TariffTimeType | null;
  fixedFee?: TariffFixedType | null;
  reservationTime?: TariffTimeType | null;
  reservationFixed?: TariffFixedType | null;
  minCost?: PriceType | null;
  maxCost?: PriceType | null;
}
