// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { TenantPartner } from './TenantPartner.js';

@Table({ tableName: 'RoamingPartners' })
export class RoamingPartner extends Model {
  @Column({ type: DataType.STRING(2), allowNull: false })
  declare countryCode: string;

  @Column({ type: DataType.STRING(3), allowNull: false })
  declare partyId: string;

  @Column({ type: DataType.STRING(10), allowNull: false })
  declare role: string;

  @Column({ type: DataType.STRING(20), allowNull: false })
  declare status: string;

  @ForeignKey(() => TenantPartner)
  @Column({ type: DataType.INTEGER, allowNull: false, onUpdate: 'CASCADE', onDelete: 'RESTRICT' })
  declare tenantPartnerId: number;

  @BelongsTo(() => TenantPartner)
  declare tenantPartner?: TenantPartner;
}
