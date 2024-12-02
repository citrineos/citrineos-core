// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { AuthorizationData, Namespace, SendLocalListRequest, UpdateEnumType } from '@citrineos/base';
import { CustomDataType } from '@citrineos/base/src/ocpp/model/types/SendLocalListRequest';
import { BelongsToMany, Column, DataType, Model, Table } from 'sequelize-typescript';
import { SendLocalListAuthorization } from './SendLocalListAuthorization';
import { LocalListAuthorization } from './LocalListAuthorization';

@Table
export class SendLocalList extends Model implements SendLocalListRequest {
  static readonly MODEL_NAME: string = Namespace.SendLocalListRequest;

  @Column
  declare stationId: string;

  @Column
  declare correlationId: string;

  @Column(DataType.INTEGER)
  declare versionNumber: number;

  @Column(DataType.STRING)
  declare updateType: UpdateEnumType;

  @BelongsToMany(() => LocalListAuthorization, () => SendLocalListAuthorization)
  declare localAuthorizationList?: [LocalListAuthorization, ...LocalListAuthorization[]] | null;

  customData?: CustomDataType | null | undefined;

  toSendLocalListRequest(): SendLocalListRequest {
    return {
      versionNumber: this.versionNumber,
      updateType: this.updateType,
      localAuthorizationList: !(this.localAuthorizationList && this.localAuthorizationList[0])
        ? null
        : (this.localAuthorizationList.map((localListAuth) => {
            return {
              idToken: {
                idToken: localListAuth.idToken.idToken,
                type: localListAuth.idToken.type,
                additionalInfo: localListAuth.idToken.additionalInfo?.map((additionalInfo) => {
                  return {
                    additionalIdToken: additionalInfo.additionalIdToken,
                    type: additionalInfo.type,
                  };
                }),
              },
              idTokenInfo: {
                status: localListAuth.idTokenInfo?.status,
                cacheExpiryDateTime: localListAuth.idTokenInfo?.cacheExpiryDateTime,
                chargingPriority: localListAuth.idTokenInfo?.chargingPriority,
                language1: localListAuth.idTokenInfo?.language1,
                groupIdToken: {
                  idToken: localListAuth.idTokenInfo?.groupIdToken?.idToken,
                  type: localListAuth.idTokenInfo?.groupIdToken?.type,
                  additionalInfo: localListAuth.idTokenInfo?.groupIdToken?.additionalInfo?.map((additionalInfo) => {
                    return {
                      additionalIdToken: additionalInfo.additionalIdToken,
                      type: additionalInfo.type,
                    };
                  }),
                },
                language2: localListAuth.idTokenInfo?.language2,
                personalMessage: localListAuth.idTokenInfo?.personalMessage,
              },
            };
          }) as [AuthorizationData, ...AuthorizationData[]] | null),
    };
  }
}
