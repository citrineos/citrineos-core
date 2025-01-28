// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP1_6 } from '@citrineos/base';
import { AbstractMapper } from '../AbstractMapper';
import { IsEnum } from 'class-validator';
import { IdTokenInfo } from '../../model/Authorization';
import { IdTokenMapper } from '../1.6';

export class IdTagInfoMapper extends AbstractMapper<IdTokenInfo> {
  @IsEnum(OCPP1_6.AuthorizeResponseStatus)
  status: OCPP1_6.AuthorizeResponseStatus;
  expiryDate?: string | null;
  parentIdTag?: IdTokenMapper | null;

  constructor(status: OCPP1_6.AuthorizeResponseStatus, expiryDate?: string | null, parentIdTag?: IdTokenMapper | null) {
    super();
    this.status = status;
    this.expiryDate = expiryDate;
    this.parentIdTag = parentIdTag;

    this.validate();
  }

  toModel(): IdTokenInfo {
    return IdTokenInfo.build({
      status: this.status,
      cacheExpiryDateTime: this.expiryDate,
      groupIdToken: this.parentIdTag ? this.parentIdTag?.toModel() : undefined,
    });
  }

  static fromModel(idTokenInfo: IdTokenInfo): IdTagInfoMapper {
    return new IdTagInfoMapper(idTokenInfo.status as OCPP1_6.AuthorizeResponseStatus, idTokenInfo.cacheExpiryDateTime, idTokenInfo.groupIdToken ? IdTokenMapper.fromModel(idTokenInfo.groupIdToken) : undefined);
  }
}
