// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { AbstractMapper } from '../AbstractMapper';
import { IsString, MaxLength } from 'class-validator';
import { IdToken } from '../../model/Authorization';

export class IdTokenMapper extends AbstractMapper<IdToken> {
  @MaxLength(20)
  @IsString()
  idToken: string;

  constructor(idToken: string) {
    super();
    this.idToken = idToken;

    this.validate();
  }

  toModel(): IdToken {
    return IdToken.build({
      idToken: this.idToken,
    });
  }

  static fromModel(idToken: IdToken): IdTokenMapper {
    return new IdTokenMapper(idToken.idToken);
  }
}
