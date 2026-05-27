// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Authorization } from './Authorization/Authorization.js';
import { Location } from './Location/Location.js';

@Table({ tableName: 'AuthorizationLocations' })
export class AuthorizationLocation extends Model {
  @ForeignKey(() => Authorization)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare authorizationId: number;

  @ForeignKey(() => Location)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare locationId: number;
}
