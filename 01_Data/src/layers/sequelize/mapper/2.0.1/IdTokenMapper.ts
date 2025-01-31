// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP2_0_1 } from '@citrineos/base';
import { AbstractMapper } from '../AbstractMapper';
import { IsEnum } from 'class-validator';
import { IdToken } from '../../model/Authorization';

export class IdTokenMapper extends AbstractMapper<IdToken> {
  idToken: string;
  @IsEnum(OCPP2_0_1.IdTokenEnumType)
  type: OCPP2_0_1.IdTokenEnumType;
  additionalInfo?: [OCPP2_0_1.AdditionalInfoType, ...OCPP2_0_1.AdditionalInfoType[]] | null;
  customData?: OCPP2_0_1.CustomDataType | null;

  constructor(idToken: string, type: OCPP2_0_1.IdTokenEnumType, additionalInfo?: [OCPP2_0_1.AdditionalInfoType, ...OCPP2_0_1.AdditionalInfoType[]] | null, customData?: OCPP2_0_1.CustomDataType | null) {
    super();
    this.idToken = idToken;
    this.type = type;
    this.additionalInfo = additionalInfo;
    this.customData = customData;

    this.validate();
  }

  toModel(): IdToken {
    return IdToken.build({
      idToken: this.idToken,
      type: this.type,
      additionalInfo: this.additionalInfo,
      customData: this.customData,
    });
  }

  static fromModel(idToken: IdToken): IdTokenMapper {
    const additionalInfoArray =
      idToken.additionalInfo && idToken.additionalInfo.length > 0
        ? (idToken.additionalInfo.map((additionalInfo) => ({
            additionalIdToken: additionalInfo.additionalIdToken,
            type: additionalInfo.type,
          })) as [OCPP2_0_1.AdditionalInfoType, ...OCPP2_0_1.AdditionalInfoType[]])
        : undefined;
    return new IdTokenMapper(idToken.idToken, idToken.type as OCPP2_0_1.IdTokenEnumType, additionalInfoArray, idToken.customData as OCPP2_0_1.CustomDataType);
  }
}
