// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  DEFAULT_TENANT_ID,
  ITenantDto,
  ITransactionDto,
  OCPP2_0_1,
  OCPP2_0_1_Namespace,
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
import { Transaction } from '../TransactionEvent/index.js';
import { Evse } from '../Location/index.js';
import { Tenant } from '../Tenant.js';

@Table
export class ChargingNeeds extends Model implements OCPP2_0_1.ChargingNeedsType {
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.ChargingNeeds;

  /**
   * Fields
   */
  @Column(DataType.JSONB)
  declare acChargingParameters?: OCPP2_0_1.ACChargingParametersType | null;

  @Column(DataType.JSONB)
  declare dcChargingParameters?: OCPP2_0_1.DCChargingParametersType | null;

  @Column({
    type: DataType.DATE,
    get() {
      const departureTime: Date = this.getDataValue('departureTime');
      return departureTime ? departureTime.toISOString() : null;
    },
  })
  declare departureTime?: string | null;

  @Column(DataType.STRING)
  declare requestedEnergyTransfer: OCPP2_0_1.EnergyTransferModeEnumType;

  @Column(DataType.INTEGER)
  declare maxScheduleTuples?: number | null;

  /**
   * Relations
   */
  @ForeignKey(() => Evse)
  @Column(DataType.INTEGER)
  declare evseId: number;

  @BelongsTo(() => Evse)
  declare evse: Evse;

  @ForeignKey(() => Transaction)
  @Column(DataType.INTEGER)
  declare transactionDatabaseId: number;

  @BelongsTo(() => Transaction)
  declare transaction: ITransactionDto;

  declare customData?: OCPP2_0_1.CustomDataType | null;

  @ForeignKey(() => Tenant)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  declare tenantId: number;

  @BelongsTo(() => Tenant)
  declare tenant?: ITenantDto;

  @BeforeUpdate
  @BeforeCreate
  static setDefaultTenant(instance: ChargingNeeds) {
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
