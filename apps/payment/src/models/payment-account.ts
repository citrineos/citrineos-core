// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Column, DataType, Model, Table } from '@citrineos/dal';
import type { PaymentAccountDto } from '../types/index.js';

@Table({ tableName: 'PaymentAccounts' })
export class PaymentAccount extends Model implements PaymentAccountDto {
  static readonly MODEL_NAME: string = 'PaymentAccount';

  declare id: number;

  @Column({ type: DataType.INTEGER, allowNull: false, unique: true })
  declare tenantId: number;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare stripeAccountId: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare scanAndChargeEnabled: boolean;

  @Column({ type: DataType.STRING(2048), allowNull: true })
  declare termsUrl: string | null;

  declare createdAt: Date;
  declare updatedAt: Date;
}
