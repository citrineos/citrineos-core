// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP2_0_1, OCPP2_0_1_Namespace } from '@citrineos/base';
import { BelongsToMany, Column, DataType, Table } from 'sequelize-typescript';
import { SendLocalListAuthorization } from './SendLocalListAuthorization';
import { LocalListAuthorization } from './LocalListAuthorization';
import { BaseModelWithTenant } from '../BaseModelWithTenant';

@Table
export class SendLocalList extends BaseModelWithTenant implements OCPP2_0_1.SendLocalListRequest {
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.SendLocalListRequest;

  @Column
  declare stationId: string;

  @Column
  declare correlationId: string;

  @Column(DataType.INTEGER)
  declare versionNumber: number;

  @Column(DataType.STRING)
  declare updateType: OCPP2_0_1.UpdateEnumType;

  // ORM relation: LocalListAuthorization[]; API contract: AuthorizationData[]
  @BelongsToMany(() => LocalListAuthorization, () => SendLocalListAuthorization)
  declare localAuthorizationList?: any;

  customData?: OCPP2_0_1.CustomDataType | null | undefined;

  toSendLocalListRequest(): OCPP2_0_1.SendLocalListRequest {
    const localAuthList = (this.localAuthorizationList || [])
      .map((localListAuth: LocalListAuthorization) => {
        return {
          idToken: {
            idToken: String(localListAuth.idToken), // ensure string
            type: localListAuth.idTokenType,
            additionalInfo: localListAuth.additionalInfo,
          },
          idTokenInfo: {
            status: localListAuth.status,
            cacheExpiryDateTime: localListAuth.cacheExpiryDateTime,
            chargingPriority: localListAuth.chargingPriority,
            language1: localListAuth.language1,
            groupIdToken: localListAuth.groupAuthorizationId,
            language2: localListAuth.language2,
            personalMessage: localListAuth.personalMessage,
          },
        } as OCPP2_0_1.AuthorizationData;
      })
      .filter(Boolean);
    return {
      versionNumber: this.versionNumber,
      updateType: this.updateType,
      localAuthorizationList:
        localAuthList.length > 0
          ? (localAuthList as [OCPP2_0_1.AuthorizationData, ...OCPP2_0_1.AuthorizationData[]])
          : null,
    };
  }
}
