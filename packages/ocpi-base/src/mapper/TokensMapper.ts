// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  AuthorizationDto,
  AuthorizationStatusEnumType,
  AuthorizationWhitelistEnumType,
  IdTokenEnumType,
} from '@citrineos/base';
import {
  AuthorizationStatusEnum,
  AuthorizationWhitelistEnum,
  IdTokenEnum,
  OCPP2_0_1,
} from '@citrineos/base';
import type { TokenDTO } from '../model/DTO/TokenDTO.js';
import { TokenType } from '../model/TokenType.js';
import { WhitelistType } from '../model/WhitelistType.js';

export class TokensMapper {
  public static toDto(authorization: AuthorizationDto): TokenDTO {
    const tokenDto: TokenDTO = {
      country_code: authorization.tenantPartner!.countryCode!,
      party_id: authorization.tenantPartner!.partyId!,
      uid: authorization.idToken,
      type: TokensMapper.mapOcppIdTokenTypeToOcpiTokenType(
        authorization.idTokenType ? authorization.idTokenType : null,
      ),
      contract_id: this.getContractId(authorization),
      visual_number: TokensMapper.getVisualNumber(authorization),
      issuer: TokensMapper.getIssuer(authorization),
      group_id: authorization.groupAuthorization?.idToken,
      valid: authorization.status === AuthorizationStatusEnum.Accepted,
      whitelist: TokensMapper.mapRealTimeEnumType(authorization.realTimeAuth),
      language: authorization.language1,
      // default_profile_type: token.default_profile_type,
      // energy_contract: token.energy_contract,
      last_updated: authorization.updatedAt!,
    };

    return tokenDto;
  }

  public static mapOcpiTokenTypeToOcppIdTokenType(type: TokenType): IdTokenEnumType {
    switch (type) {
      case TokenType.RFID:
        // If you are actually using ISO15693, you need to change this
        return IdTokenEnum.ISO14443;
      case TokenType.AD_HOC_USER:
        return IdTokenEnum.Local;
      case TokenType.APP_USER:
        return IdTokenEnum.Central;
      case TokenType.OTHER:
        return IdTokenEnum.Other;
      default:
        throw new Error(`Unknown token type: ${type}`);
    }
  }

  public static mapOcppIdTokenTypeToOcpiTokenType(
    type: IdTokenEnumType | null | undefined,
  ): TokenType {
    switch (type) {
      case IdTokenEnum.ISO14443:
        // If you are actually using ISO15693, you need to change this
        return TokenType.RFID;
      case IdTokenEnum.Local:
        return TokenType.AD_HOC_USER;
      case IdTokenEnum.Central:
        return TokenType.APP_USER;
      case null:
        return TokenType.OTHER;
      default:
        throw new Error(`Unknown token type: ${type}`);
    }
  }

  public static mapRealTimeEnumType(
    type: AuthorizationWhitelistEnumType | null | undefined,
  ): WhitelistType {
    switch (type) {
      case AuthorizationWhitelistEnum.Allowed:
        return WhitelistType.ALLOWED;
      case AuthorizationWhitelistEnum.AllowedOffline:
        return WhitelistType.ALLOWED_OFFLINE;
      case AuthorizationWhitelistEnum.Never:
        return WhitelistType.NEVER;
      default:
        return WhitelistType.ALWAYS;
    }
  }

  public static mapWhitelistType(
    whitelist: WhitelistType | undefined,
  ): AuthorizationWhitelistEnumType | null | undefined {
    switch (whitelist) {
      case WhitelistType.ALLOWED:
        return AuthorizationWhitelistEnum.Allowed;
      case WhitelistType.ALLOWED_OFFLINE:
        return AuthorizationWhitelistEnum.AllowedOffline;
      case WhitelistType.NEVER:
        return AuthorizationWhitelistEnum.Never;
      case WhitelistType.ALWAYS:
        return null;
      default:
        return undefined;
    }
  }

  public static mapOcpiTokenToPartialOcppAuthorization(
    tokenDto: Partial<TokenDTO>,
  ): Partial<AuthorizationDto> {
    const idToken: string | undefined = tokenDto.uid;
    const idTokenType: IdTokenEnumType | undefined =
      tokenDto.type && TokensMapper.mapOcpiTokenTypeToOcppIdTokenType(tokenDto.type);

    const partialAdditionalInfo: OCPP2_0_1.AdditionalInfoType[] = [];

    if (tokenDto.contract_id) {
      partialAdditionalInfo.push({
        additionalIdToken: tokenDto.contract_id,
        type: OCPP2_0_1.IdTokenEnumType.eMAID,
      });
    }
    if (tokenDto.visual_number) {
      partialAdditionalInfo.push({
        additionalIdToken: tokenDto.visual_number,
        type: 'visual_number',
      });
    }
    if (tokenDto.issuer) {
      partialAdditionalInfo.push({
        additionalIdToken: tokenDto.issuer,
        type: 'issuer',
      });
    }

    const additionalInfo:
      | [OCPP2_0_1.AdditionalInfoType, ...OCPP2_0_1.AdditionalInfoType[]]
      | undefined =
      partialAdditionalInfo.length > 0
        ? (partialAdditionalInfo as [
            OCPP2_0_1.AdditionalInfoType,
            ...OCPP2_0_1.AdditionalInfoType[],
          ])
        : undefined;

    const status: AuthorizationStatusEnumType = tokenDto.valid
      ? AuthorizationStatusEnum.Accepted
      : AuthorizationStatusEnum.Invalid;

    const language1: string | undefined = tokenDto.language ?? undefined;

    const realTimeAuth: AuthorizationWhitelistEnumType | null | undefined =
      TokensMapper.mapWhitelistType(tokenDto.whitelist);

    return {
      additionalInfo,
      idToken,
      idTokenType,
      status,
      language1,
      realTimeAuth,
    };
  }

  public static getContractId(authorization: AuthorizationDto): string {
    const contractId = authorization.additionalInfo!.find(
      (info) => info.type === OCPP2_0_1.IdTokenEnumType.eMAID,
    )?.additionalIdToken;
    if (!contractId) {
      throw new Error(
        'Contract ID not found in authorization additional info, authorization is incomplete for OCPI token mapping. Please add additional info with type eMAID.',
      );
    }
    return contractId;
  }

  public static getVisualNumber(authorization: AuthorizationDto): string | undefined {
    const visualNumber = authorization.additionalInfo!.find(
      (info) => info.type === 'visual_number',
    )?.additionalIdToken;
    if (!visualNumber) {
      return undefined;
    }
    return visualNumber;
  }

  public static getIssuer(authorization: AuthorizationDto): string {
    const issuer = authorization.additionalInfo!.find(
      (info) => info.type === 'issuer',
    )?.additionalIdToken;
    if (!issuer) {
      throw new Error(
        'Issuer not found in authorization additional info, authorization is incomplete for OCPI token mapping. Please add additional info with type issuer.',
      );
    }
    return issuer;
  }

  // public static mapTokenDTOToPartialAuthorization(
  //   existingAuth: Authorization,
  //   tokenDTO: Partial<TokenDTO>,
  // ): Partial<OCPP2_0_1.IdTokenInfoType> {
  //   const idTokenInfo: Partial<OCPP2_0_1.IdTokenInfoType> = {
  //     status: existingAuth.idTokenInfo?.status,
  //   };

  //   if (tokenDTO.valid !== undefined) {
  //     idTokenInfo.status = tokenDTO.valid
  //       ? OCPP2_0_1.AuthorizationStatusEnumType.Accepted
  //       : OCPP2_0_1.AuthorizationStatusEnumType.Invalid;
  //   }

  //   if (tokenDTO.group_id) {
  //     idTokenInfo.groupIdToken = {
  //       idToken: tokenDTO.group_id,
  //       type: OcpiTokensMapper.mapOcpiTokenTypeToOcppIdTokenType(
  //         tokenDTO.type!,
  //       ),
  //     };
  //   }

  //   if (tokenDTO.language) {
  //     idTokenInfo.language1 = tokenDTO.language;
  //   }

  //   return idTokenInfo;
  // }

  public static toGraphqlWhere(token: TokenDTO): any {
    return {
      idToken: { _eq: token.uid },
      IdTokenType: {
        _eq: TokensMapper.mapOcpiTokenTypeToOcppIdTokenType(token.type),
      },
      TenantPartner: {
        countryCode: { _eq: token.country_code },
        partyId: { _eq: token.party_id },
      },
    };
  }

  public static toGraphqlSet(token: Partial<TokenDTO>): any {
    const set: any = TokensMapper.mapOcpiTokenToPartialOcppAuthorization(token);
    return set;
  }
}
