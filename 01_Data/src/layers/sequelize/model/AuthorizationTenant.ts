// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Authorization } from './Authorization/Authorization.js';
import { Tenant } from './Tenant.js';

@Table({ tableName: 'AuthorizationTenants' })
export class AuthorizationTenant extends Model {
  @ForeignKey(() => Authorization)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare authorizationId: number;

  @ForeignKey(() => Tenant)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare tenantId: number;
}
