// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { TariffData } from '@citrineos/dal';
import { Column, DataType, Model, Table } from '@citrineos/dal';
import type {
  CheckoutDto,
  CheckoutFlow,
  CheckoutStatus,
  RemoteStartStatus,
} from '../types/index.js';

@Table({
  tableName: 'Checkouts',
  indexes: [
    { name: 'checkouts_tenant_transaction', fields: ['tenantId', 'transactionDatabaseId'] },
    { name: 'checkouts_status_updated', fields: ['status', 'updatedAt'] },
  ],
})
export class Checkout extends Model implements CheckoutDto {
  static readonly MODEL_NAME: string = 'Checkout';

  declare id: number;

  @Column({ type: DataType.UUID, allowNull: false, unique: true, defaultValue: DataType.UUIDV4 })
  declare publicId: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare tenantId: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare stripeAccountId: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare flow: CheckoutFlow;

  @Column({ type: DataType.STRING, allowNull: false })
  declare status: CheckoutStatus;

  @Column(DataType.INTEGER)
  declare connectorId: number | null;

  @Column(DataType.INTEGER)
  declare tariffId: number | null;

  @Column({ type: DataType.JSONB, allowNull: false })
  declare tariffSnapshot: TariffData;

  @Column(DataType.INTEGER)
  declare transactionDatabaseId: number | null;

  @Column({ type: DataType.CHAR(3), allowNull: false })
  declare currency: string;

  @Column(DataType.INTEGER)
  declare authorizedAmount: number | null;

  @Column(DataType.INTEGER)
  declare capturedAmount: number | null;

  @Column({ type: DataType.STRING, unique: true })
  declare paymentIntentId: string | null;

  @Column(DataType.STRING)
  declare remoteStartStatus: RemoteStartStatus | null;

  @Column(DataType.INTEGER)
  declare qrDisplayMessageId: number | null;

  declare createdAt: Date;
  declare updatedAt: Date;
}
