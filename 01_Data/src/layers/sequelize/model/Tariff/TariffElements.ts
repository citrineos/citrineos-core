// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { CreationOptional } from 'sequelize';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Tariff } from './Tariffs.js';

@Table({ tableName: 'TariffElements', timestamps: true })
export class TariffElement extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => Tariff)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  declare tariffId: number;

  @BelongsTo(() => Tariff)
  declare tariff?: Tariff;

  @Column({
    type: DataType.JSONB,
    allowNull: false,
  })
  declare priceComponents: object;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  declare restrictions?: object | null;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}
