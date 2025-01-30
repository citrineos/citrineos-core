import { IsNotEmpty } from 'class-validator';
import { Authorization, IdToken, IdTokenInfo } from '../../model/Authorization';
import { AbstractMapper } from '../AbstractMapper';

export class AuthorizationMapper extends AbstractMapper<Authorization> {
  @IsNotEmpty()
  allowedConnectorTypes: string[];

  disallowedEvseIdPrefixes: string[];

  idTokenId: number;

  idToken: IdToken;

  idTokenInfoId: number;

  idTokenInfo: IdTokenInfo;

  constructor(allowedConnectorTypes: string[], disallowedEvseIdPrefixes: string[], idTokenId: number, idToken: IdToken, idTokenInfoId: number, idTokenInfo: IdTokenInfo) {
    super();
    this.allowedConnectorTypes = allowedConnectorTypes;
    this.disallowedEvseIdPrefixes = disallowedEvseIdPrefixes;
    this.idTokenId = idTokenId;
    this.idToken = idToken;
    this.idTokenInfoId = idTokenInfoId;
    this.idTokenInfo = idTokenInfo;
    this.validate();
  }

  toModel(): Authorization {
    return Authorization.build({
        
      allowedConnectorTypes: this.allowedConnectorTypes,
      disallowedEvseIdPrefixes: this.disallowedEvseIdPrefixes,
      idTokenId: this.idTokenId,
      idToken: this.idToken,
      idTokenInfoId: this.idTokenInfoId,
      idTokenInfo: this.idTokenInfo,
    });
  }

  static fromModel(authorization: Authorization): AuthorizationMapper {
    return new AuthorizationMapper(
      authorization.allowedConnectorTypes as string[],
      authorization.disallowedEvseIdPrefixes as string[],
      authorization.idTokenId as number,
      authorization.idToken,
      authorization.idTokenInfoId as number,
      authorization.idTokenInfo as IdTokenInfo,
    );
  }
}
