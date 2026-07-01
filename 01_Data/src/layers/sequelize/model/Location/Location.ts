// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  LocationDto,
  LocationFacilityEnumType,
  LocationParkingEnumType,
  Point,
  TenantDto,
  PublishTokenType,
  EnergyMix,
  Image,
  BusinessDetails,
  DisplayText,
  AdditionalGeoLocation,
} from '@citrineos/base';
import { DEFAULT_TENANT_ID, LocationHours, OCPP2_0_1_Namespace } from '@citrineos/base';
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
import { Tenant } from '../Tenant.js';
import { ChargingStation } from './ChargingStation.js';
import { TenantPartner } from '../TenantPartner.js';
import { RoamingPartner } from '../RoamingPartner.js';

/**
 * Represents a location.
 * Currently, this data model is internal to CitrineOS. In the future, it will be analogous to an OCPI Location.
 */
@Table
export class Location extends Model implements LocationDto {
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.Location;

  @Column(DataType.STRING)
  declare name: string;

  @Column(DataType.STRING)
  declare address: string;

  @Column(DataType.STRING)
  declare city: string;

  @Column(DataType.STRING)
  declare postalCode: string;

  @Column(DataType.STRING)
  declare state: string;

  @Column(DataType.STRING)
  declare country: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  declare publishUpstream: boolean;

  @Column(DataType.JSONB)
  declare publishAllowedTo?: PublishTokenType[] | null;

  @Column(DataType.JSONB)
  declare energyMix?: EnergyMix | null;

  @Column(DataType.JSONB)
  declare images?: Image[] | null;

  @Column(DataType.JSONB)
  declare directions?: DisplayText[] | null;

  @Column(DataType.JSONB)
  declare operator?: BusinessDetails | null;

  @Column(DataType.JSONB)
  declare suboperator?: BusinessDetails | null;

  @Column(DataType.JSONB)
  declare owner?: BusinessDetails | null;

  @Column(DataType.BOOLEAN)
  declare chargingWhenClosed?: boolean | null;

  @Column(DataType.JSONB)
  declare relatedLocations?: AdditionalGeoLocation[] | null;

  @Column(DataType.STRING(36))
  declare ocpiId?: string | null;

  @Column({
    type: DataType.STRING,
    defaultValue: 'UTC',
    validate: {
      isTimezone(value: string) {
        try {
          Intl.DateTimeFormat(undefined, { timeZone: value });
          return true;
        } catch (_ex) {
          return false;
        }
      },
    },
  })
  declare timeZone: string;

  @Column(DataType.STRING)
  declare parkingType?: LocationParkingEnumType | null;

  @Column(DataType.JSONB)
  declare facilities?: LocationFacilityEnumType[] | null;

  @Column(DataType.JSONB)
  declare openingHours?: LocationHours | null;

  @Column(DataType.BOOLEAN)
  declare disableOCPI?: boolean | null;

  /**
   * [longitude, latitude]
   */
  @Column(DataType.GEOMETRY('POINT'))
  declare coordinates: Point;

  @HasMany(() => ChargingStation)
  declare chargingPool: [ChargingStation, ...ChargingStation[]];

  @ForeignKey(() => Tenant)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  declare tenantId: number;

  @BelongsTo(() => Tenant)
  declare tenant?: TenantDto;

  @BeforeUpdate
  @BeforeCreate
  static setDefaultTenant(instance: Location) {
    if (instance.tenantId == null) {
      instance.tenantId = DEFAULT_TENANT_ID;
    }
  }

  @ForeignKey(() => TenantPartner)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  })
  declare ownerTenantPartnerId?: number | null;

  @BelongsTo(() => TenantPartner)
  declare ownerTenantPartner?: TenantPartner;

  @ForeignKey(() => RoamingPartner)
  @Column({ type: DataType.INTEGER, allowNull: true, onUpdate: 'CASCADE', onDelete: 'SET NULL' })
  declare roamingPartnerId?: number | null;

  @BelongsTo(() => RoamingPartner)
  declare roamingPartner?: RoamingPartner;

  constructor(...args: any[]) {
    super(...args);
    if (this.tenantId == null) {
      this.tenantId = DEFAULT_TENANT_ID;
    }
  }
}
