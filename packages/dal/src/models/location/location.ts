// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type ChargingStationDto,
  type LocationDto,
  type LocationFacilityEnumType,
  type LocationParkingEnumType,
  type Point,
  type TenantDto,
  type TransactionDto,
  LocationHours,
} from '@citrineos/types';
import { DEFAULT_TENANT_ID, OCPP2_Namespace } from '@citrineos/base';
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

import { Tenant } from '../tenant.js';
import { Transaction } from '../transaction-event/transaction.js';
import { ChargingStation } from './charging-station.js';

/**
 * Represents a location.
 * Currently, this data model is internal to CitrineOS. In the future, it will be analogous to an OCPI Location.
 */
@Table
export class Location extends Model implements LocationDto {
  static readonly MODEL_NAME: string = OCPP2_Namespace.Location;

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

  /**
   * [longitude, latitude]
   */
  @Column(DataType.GEOMETRY('POINT'))
  declare coordinates: Point;

  @HasMany(() => ChargingStation, 'locationId')
  declare chargingPool: [ChargingStationDto, ...ChargingStationDto[]];

  @HasMany(() => Transaction, 'locationId')
  declare transactions?: TransactionDto[];

  @ForeignKey(() => Tenant)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  declare tenantId: number;

  @BelongsTo(() => Tenant, 'tenantId')
  declare tenant?: TenantDto;

  @BeforeUpdate
  @BeforeCreate
  static setDefaultTenant(instance: Location) {
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
