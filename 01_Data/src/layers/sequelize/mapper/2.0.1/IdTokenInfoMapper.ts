// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP2_0_1 } from '@citrineos/base';
import { AbstractMapper } from '../AbstractMapper';
import { IsEnum } from 'class-validator';
import { IdTokenInfo } from '../../model/Authorization';
import { IdTokenMapper } from './IdTokenMapper';

export class IdTokenInfoMapper extends AbstractMapper<IdTokenInfo> {
  @IsEnum(OCPP2_0_1.AuthorizationStatusEnumType)
  status: OCPP2_0_1.AuthorizationStatusEnumType;
  cacheExpiryDateTime?: string | null;
  chargingPriority?: number | null;
  language1?: string | null;
  evseId?: [number, ...number[]] | null;
  groupIdToken?: IdTokenMapper | null;
  language2?: string | null;
  personalMessage?: OCPP2_0_1.MessageContentType | null;
  customData?: OCPP2_0_1.CustomDataType | null;

  constructor(
    status: OCPP2_0_1.AuthorizationStatusEnumType,
    cacheExpiryDateTime?: string | null,
    chargingPriority?: number | null,
    language1?: string | null,
    evseId?: [number, ...number[]] | null,
    groupIdToken?: IdTokenMapper | null,
    language2?: string | null,
    personalMessage?: OCPP2_0_1.MessageContentType | null,
    customData?: OCPP2_0_1.CustomDataType | null,
  ) {
    super();
    this.status = status;
    this.cacheExpiryDateTime = cacheExpiryDateTime;
    this.chargingPriority = chargingPriority;
    this.language1 = language1;
    this.evseId = evseId;
    this.groupIdToken = groupIdToken;
    this.language2 = language2;
    this.personalMessage = personalMessage;
    this.customData = customData;

    this.validate();
  }

  toModel(): IdTokenInfo {
    return IdTokenInfo.build({
      status: this.status,
      cacheExpiryDateTime: this.cacheExpiryDateTime,
      chargingPriority: this.chargingPriority,
      language1: this.language1,
      evseId: this.evseId,
      groupIdToken: this.groupIdToken?.toModel(),
      language2: this.language2,
      personalMessage: this.personalMessage,
      customData: this.customData,
    });
  }

  static fromModel(idTokenInfo: IdTokenInfo): IdTokenInfoMapper {
    return new IdTokenInfoMapper(
      idTokenInfo.status as OCPP2_0_1.AuthorizationStatusEnumType,
      idTokenInfo.cacheExpiryDateTime,
      idTokenInfo.chargingPriority,
      idTokenInfo.language1,
      idTokenInfo.evseId,
      idTokenInfo.groupIdToken ? IdTokenMapper.fromModel(idTokenInfo.groupIdToken) : undefined,
      idTokenInfo.language2,
      idTokenInfo.personalMessage ? idTokenInfo.personalMessage as OCPP2_0_1.MessageContentType : undefined,
      idTokenInfo.customData as OCPP2_0_1.CustomDataType,
    );
  }
}
