// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { AuthorizationStatusType, IdTokenType, OCPP2_0_1 } from '@citrineos/base';
import { Authorization } from '../../model/Authorization';

export class AuthorizationMapper {
  static toAuthorizationData(authorization: Authorization): OCPP2_0_1.AuthorizationData {
    return {
      customData: authorization.customData,
      idToken: AuthorizationMapper.toIdToken(authorization),
      idTokenInfo: AuthorizationMapper.toIdTokenInfo(authorization),
    };
  }

  static toIdToken(authorization: Authorization): OCPP2_0_1.IdTokenType {
    if (!authorization.idTokenType) {
      throw new Error('IdToken type is missing.');
    }
    return {
      customData: authorization.customData,
      additionalInfo: authorization.additionalInfo ?? null,
      idToken: authorization.idToken,
      type: AuthorizationMapper.toIdTokenEnumType(authorization.idTokenType),
    };
  }

  static toIdTokenInfo(authorization: Authorization): OCPP2_0_1.IdTokenInfoType {
    return {
      status: AuthorizationMapper.fromAuthorizationStatusType(authorization.status),
      cacheExpiryDateTime: authorization.cacheExpiryDateTime,
      chargingPriority: authorization.chargingPriority,
      language1: authorization.language1,
      language2: authorization.language2,
      personalMessage: authorization.personalMessage,
      customData: authorization.customData,
    };
  }

  static toMessageContentType(messageContent: any): OCPP2_0_1.MessageContentType {
    return {
      customData: messageContent.customData,
      format: AuthorizationMapper.toMessageFormatEnum(messageContent.format),
      language: messageContent.language,
      content: messageContent.content,
    };
  }

  static toMessageFormatEnum(messageFormat: string): OCPP2_0_1.MessageFormatEnumType {
    switch (messageFormat) {
      case 'ASCII':
        return OCPP2_0_1.MessageFormatEnumType.ASCII;
      case 'HTML':
        return OCPP2_0_1.MessageFormatEnumType.HTML;
      case 'URI':
        return OCPP2_0_1.MessageFormatEnumType.URI;
      case 'UTF8':
        return OCPP2_0_1.MessageFormatEnumType.UTF8;
      default:
        throw new Error('Unknown message format');
    }
  }

  static fromAuthorizationStatusType(
    status: AuthorizationStatusType,
  ): OCPP2_0_1.AuthorizationStatusEnumType {
    switch (status) {
      case AuthorizationStatusType.Accepted:
        return OCPP2_0_1.AuthorizationStatusEnumType.Accepted;
      case AuthorizationStatusType.Blocked:
        return OCPP2_0_1.AuthorizationStatusEnumType.Blocked;
      case AuthorizationStatusType.ConcurrentTx:
        return OCPP2_0_1.AuthorizationStatusEnumType.ConcurrentTx;
      case AuthorizationStatusType.Expired:
        return OCPP2_0_1.AuthorizationStatusEnumType.Expired;
      case AuthorizationStatusType.Invalid:
        return OCPP2_0_1.AuthorizationStatusEnumType.Invalid;
      case AuthorizationStatusType.NoCredit:
        return OCPP2_0_1.AuthorizationStatusEnumType.NoCredit;
      case AuthorizationStatusType.NotAllowedTypeEVSE:
        return OCPP2_0_1.AuthorizationStatusEnumType.NotAllowedTypeEVSE;
      case AuthorizationStatusType.NotAtThisLocation:
        return OCPP2_0_1.AuthorizationStatusEnumType.NotAtThisLocation;
      case AuthorizationStatusType.NotAtThisTime:
        return OCPP2_0_1.AuthorizationStatusEnumType.NotAtThisTime;
      case AuthorizationStatusType.Unknown:
        return OCPP2_0_1.AuthorizationStatusEnumType.Unknown;
      default:
        throw new Error('Unknown authorization status');
    }
  }
  static toAuthorizationStatusType(
    status: OCPP2_0_1.AuthorizationStatusEnumType,
  ): AuthorizationStatusType {
    switch (status) {
      case OCPP2_0_1.AuthorizationStatusEnumType.Accepted:
        return AuthorizationStatusType.Accepted;
      case OCPP2_0_1.AuthorizationStatusEnumType.Blocked:
        return AuthorizationStatusType.Blocked;
      case OCPP2_0_1.AuthorizationStatusEnumType.ConcurrentTx:
        return AuthorizationStatusType.ConcurrentTx;
      case OCPP2_0_1.AuthorizationStatusEnumType.Expired:
        return AuthorizationStatusType.Expired;
      case OCPP2_0_1.AuthorizationStatusEnumType.Invalid:
        return AuthorizationStatusType.Invalid;
      case OCPP2_0_1.AuthorizationStatusEnumType.NoCredit:
        return AuthorizationStatusType.NoCredit;
      case OCPP2_0_1.AuthorizationStatusEnumType.NotAllowedTypeEVSE:
        return AuthorizationStatusType.NotAllowedTypeEVSE;
      case OCPP2_0_1.AuthorizationStatusEnumType.NotAtThisLocation:
        return AuthorizationStatusType.NotAtThisLocation;
      case OCPP2_0_1.AuthorizationStatusEnumType.NotAtThisTime:
        return AuthorizationStatusType.NotAtThisTime;
      case OCPP2_0_1.AuthorizationStatusEnumType.Unknown:
        return AuthorizationStatusType.Unknown;
      default:
        throw new Error('Unknown authorization status');
    }
  }

  static toIdTokenEnumType(type: IdTokenType): OCPP2_0_1.IdTokenEnumType {
    switch (type) {
      case IdTokenType.Central:
      case IdTokenType.Other:
        return OCPP2_0_1.IdTokenEnumType.Central;
      case IdTokenType.eMAID:
        return OCPP2_0_1.IdTokenEnumType.eMAID;
      case IdTokenType.ISO14443:
        return OCPP2_0_1.IdTokenEnumType.ISO14443;
      case IdTokenType.ISO15693:
        return OCPP2_0_1.IdTokenEnumType.ISO15693;
      case IdTokenType.KeyCode:
        return OCPP2_0_1.IdTokenEnumType.KeyCode;
      case IdTokenType.Local:
        return OCPP2_0_1.IdTokenEnumType.Local;
      case IdTokenType.MacAddress:
        return OCPP2_0_1.IdTokenEnumType.MacAddress;
      case IdTokenType.NoAuthorization:
        return OCPP2_0_1.IdTokenEnumType.NoAuthorization;
      default:
        throw new Error(`Unknown idToken type: ${type}`);
    }
  }

  static fromIdTokenEnumType(type: OCPP2_0_1.IdTokenEnumType): IdTokenType {
    switch (type) {
      case OCPP2_0_1.IdTokenEnumType.Central:
        return IdTokenType.Central;
      case OCPP2_0_1.IdTokenEnumType.eMAID:
        return IdTokenType.eMAID;
      case OCPP2_0_1.IdTokenEnumType.ISO14443:
        return IdTokenType.ISO14443;
      case OCPP2_0_1.IdTokenEnumType.ISO15693:
        return IdTokenType.ISO15693;
      case OCPP2_0_1.IdTokenEnumType.KeyCode:
        return IdTokenType.KeyCode;
      case OCPP2_0_1.IdTokenEnumType.Local:
        return IdTokenType.Local;
      case OCPP2_0_1.IdTokenEnumType.MacAddress:
        return IdTokenType.MacAddress;
      case OCPP2_0_1.IdTokenEnumType.NoAuthorization:
        return IdTokenType.NoAuthorization;
      default:
        throw new Error(`Unknown OCPP 2.0.1 idToken type: ${type}`);
    }
  }
}
