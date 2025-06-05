import { BelongsTo, ForeignKey, Table } from 'sequelize-typescript';
import { OCPP2_0_1_Namespace } from '@citrineos/base';
import { ChargingStation } from './ChargingStation';
import { StatusNotification } from './StatusNotification';
import { BaseModelWithTenant } from '../BaseModelWithTenant';

@Table
export class LatestStatusNotification extends BaseModelWithTenant {
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.LatestStatusNotification;

  @ForeignKey(() => ChargingStation)
  declare stationId: string;

  @BelongsTo(() => ChargingStation)
  declare chargingStation: ChargingStation;

  @ForeignKey(() => StatusNotification)
  declare statusNotificationId: string;

  @BelongsTo(() => StatusNotification)
  declare statusNotification: StatusNotification;
}
