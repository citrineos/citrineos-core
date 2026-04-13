// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_TENANT_ID } from '@citrineos/base';
import type {
  AuthMethodEnumType,
  CdrDimensionTypeEnumType,
  TariffDimensionTypeEnumType,
  TokenTypeEnumType,
} from '@citrineos/base';

import {
  BeforeCreate,
  BeforeUpdate,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Tenant } from '../Tenant.js';
import { TenantPartner } from '../TenantPartner.js';

@Table({ tableName: 'Cdrs' })
export class Cdr extends Model {
  @Column({ type: DataType.STRING(39), allowNull: false })
  declare ocpiCdrId: string;

  @Column({ type: DataType.STRING(2), allowNull: false })
  declare countryCode: string;

  @Column({ type: DataType.STRING(3), allowNull: false })
  declare partyId: string;

  @Column({ type: DataType.DATE, allowNull: false })
  declare startDateTime: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  declare endDateTime: Date;

  @Column({ type: DataType.STRING(36), allowNull: true })
  declare sessionId?: string | null;

  @Column({ type: DataType.JSONB, allowNull: false })
  declare cdrToken: {
    uid: string;
    type: TokenTypeEnumType;
    party_id: string;
    contract_id: string;
    country_code: string;
  };

  @Column({ type: DataType.STRING(50), allowNull: false })
  declare authMethod: AuthMethodEnumType;

  @Column({ type: DataType.STRING(36), allowNull: true })
  declare authorizationReference?: string | null;

  @Column({ type: DataType.JSONB, allowNull: false })
  declare cdrLocation: {
    id: string;
    name?: string | null;
    address: string;
    city: string;
    postal_code?: string | null;
    state?: string | null;
    country: string;
    coordinates: { latitude: string; longitude: string };
    evse_uid: string;
    evse_id: string;
    connector_id: string;
    connector_standard: string;
    connector_format: string;
    connector_power_type: string;
  };

  @Column({ type: DataType.STRING(255), allowNull: true })
  declare meterId?: string | null;

  @Column({ type: DataType.STRING(3), allowNull: false })
  declare currency: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  declare tariffs?: Array<{
    id: string;
    currency: string;
    elements: Array<{
      price_components: Array<{
        type: TariffDimensionTypeEnumType;
        price: number;
        vat?: number | null;
        step_size: number;
      }>;
    }>;
    party_id: string;
    country_code: string;
    last_updated: string;
  }> | null;

  @Column({ type: DataType.JSONB, allowNull: false })
  declare chargingPeriods: Array<{
    start_date_time: Date;
    dimensions: Array<{ type: CdrDimensionTypeEnumType; volume: number }>;
    tariff_id?: string | null;
  }>;

  @Column({ type: DataType.JSONB, allowNull: true })
  declare signedData?: object | null;

  @Column({ type: DataType.JSONB, allowNull: false })
  declare totalCost: { excl_vat: number; incl_vat?: number | null };

  @Column({ type: DataType.JSONB, allowNull: true })
  declare totalFixedCost?: { excl_vat: number; incl_vat?: number | null } | null;

  @Column({ type: DataType.DECIMAL, allowNull: false })
  declare totalEnergy: number;

  @Column({ type: DataType.JSONB, allowNull: true })
  declare totalEnergyCost?: { excl_vat: number; incl_vat?: number | null } | null;

  @Column({ type: DataType.DECIMAL, allowNull: false })
  declare totalTime: number;

  @Column({ type: DataType.JSONB, allowNull: true })
  declare totalTimeCost?: { excl_vat: number; incl_vat?: number | null } | null;

  @Column({ type: DataType.DECIMAL, allowNull: true })
  declare totalParkingTime?: number | null;

  @Column({ type: DataType.JSONB, allowNull: true })
  declare totalParkingCost?: { excl_vat: number; incl_vat?: number | null } | null;

  @Column({ type: DataType.JSONB, allowNull: true })
  declare totalReservationCost?: { excl_vat: number; incl_vat?: number | null } | null;

  @Column({ type: DataType.STRING(255), allowNull: true })
  declare remark?: string | null;

  @Column({ type: DataType.STRING(39), allowNull: true })
  declare invoiceReferenceId?: string | null;

  @Column({ type: DataType.BOOLEAN, allowNull: true })
  declare credit?: boolean | null;

  @Column({ type: DataType.STRING(39), allowNull: true })
  declare creditReferenceId?: string | null;

  @Column({ type: DataType.BOOLEAN, allowNull: true })
  declare homeChargingCompensation?: boolean | null;

  @Column({ type: DataType.DATE, allowNull: false })
  declare lastUpdated: Date;

  @ForeignKey(() => Tenant)
  @Column({ type: DataType.INTEGER, allowNull: false, onUpdate: 'CASCADE', onDelete: 'RESTRICT' })
  declare tenantId: number;

  @BelongsTo(() => Tenant)
  declare tenant?: Tenant;

  @ForeignKey(() => TenantPartner)
  @Column({ type: DataType.INTEGER, allowNull: false, onUpdate: 'CASCADE', onDelete: 'RESTRICT' })
  declare tenantPartnerId: number;

  @BelongsTo(() => TenantPartner)
  declare tenantPartner?: TenantPartner;

  @BeforeCreate
  @BeforeUpdate
  static setDefaultTenant(instance: Cdr) {
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
