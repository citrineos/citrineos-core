// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { AuthorizationStatusEnumType, IdTokenEnumType } from '@citrineos/base';
import { AuthorizationStatusEnum, IdTokenEnum, OCPP2_0_1 } from '@citrineos/base';
import { Authorization } from '../../model/index.js';
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
      status: AuthorizationMapper.fromAuthorizationStatusEnumType(authorization.status),
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

  static fromAuthorizationStatusEnumType(
    status: AuthorizationStatusEnumType,
  ): OCPP2_0_1.AuthorizationStatusEnumType {
    switch (status) {
      case AuthorizationStatusEnum.Accepted:
        return OCPP2_0_1.AuthorizationStatusEnumType.Accepted;
      case AuthorizationStatusEnum.Blocked:
        return OCPP2_0_1.AuthorizationStatusEnumType.Blocked;
      case AuthorizationStatusEnum.ConcurrentTx:
        return OCPP2_0_1.AuthorizationStatusEnumType.ConcurrentTx;
      case AuthorizationStatusEnum.Expired:
        return OCPP2_0_1.AuthorizationStatusEnumType.Expired;
      case AuthorizationStatusEnum.Invalid:
        return OCPP2_0_1.AuthorizationStatusEnumType.Invalid;
      case AuthorizationStatusEnum.NoCredit:
        return OCPP2_0_1.AuthorizationStatusEnumType.NoCredit;
      case AuthorizationStatusEnum.NotAllowedTypeEVSE:
        return OCPP2_0_1.AuthorizationStatusEnumType.NotAllowedTypeEVSE;
      case AuthorizationStatusEnum.NotAtThisLocation:
        return OCPP2_0_1.AuthorizationStatusEnumType.NotAtThisLocation;
      case AuthorizationStatusEnum.NotAtThisTime:
        return OCPP2_0_1.AuthorizationStatusEnumType.NotAtThisTime;
      case AuthorizationStatusEnum.Unknown:
        return OCPP2_0_1.AuthorizationStatusEnumType.Unknown;
      default:
        throw new Error('Unknown authorization status: ' + status);
    }
  }

  static toAuthorizationStatusEnumType(
    status: OCPP2_0_1.AuthorizationStatusEnumType,
  ): AuthorizationStatusEnumType {
    switch (status) {
      case OCPP2_0_1.AuthorizationStatusEnumType.Accepted:
        return AuthorizationStatusEnum.Accepted;
      case OCPP2_0_1.AuthorizationStatusEnumType.Blocked:
        return AuthorizationStatusEnum.Blocked;
      case OCPP2_0_1.AuthorizationStatusEnumType.ConcurrentTx:
        return AuthorizationStatusEnum.ConcurrentTx;
      case OCPP2_0_1.AuthorizationStatusEnumType.Expired:
        return AuthorizationStatusEnum.Expired;
      case OCPP2_0_1.AuthorizationStatusEnumType.Invalid:
        return AuthorizationStatusEnum.Invalid;
      case OCPP2_0_1.AuthorizationStatusEnumType.NoCredit:
        return AuthorizationStatusEnum.NoCredit;
      case OCPP2_0_1.AuthorizationStatusEnumType.NotAllowedTypeEVSE:
        return AuthorizationStatusEnum.NotAllowedTypeEVSE;
      case OCPP2_0_1.AuthorizationStatusEnumType.NotAtThisLocation:
        return AuthorizationStatusEnum.NotAtThisLocation;
      case OCPP2_0_1.AuthorizationStatusEnumType.NotAtThisTime:
        return AuthorizationStatusEnum.NotAtThisTime;
      case OCPP2_0_1.AuthorizationStatusEnumType.Unknown:
        return AuthorizationStatusEnum.Unknown;
      default:
        throw new Error('Unknown authorization status');
    }
  }

  static toIdTokenEnumType(type: IdTokenEnumType): OCPP2_0_1.IdTokenEnumType {
    switch (type) {
      case IdTokenEnum.Central:
      case IdTokenEnum.Other:
        return OCPP2_0_1.IdTokenEnumType.Central;
      case IdTokenEnum.eMAID:
        return OCPP2_0_1.IdTokenEnumType.eMAID;
      case IdTokenEnum.ISO14443:
        return OCPP2_0_1.IdTokenEnumType.ISO14443;
      case IdTokenEnum.ISO15693:
        return OCPP2_0_1.IdTokenEnumType.ISO15693;
      case IdTokenEnum.KeyCode:
        return OCPP2_0_1.IdTokenEnumType.KeyCode;
      case IdTokenEnum.Local:
        return OCPP2_0_1.IdTokenEnumType.Local;
      case IdTokenEnum.MacAddress:
        return OCPP2_0_1.IdTokenEnumType.MacAddress;
      case IdTokenEnum.NoAuthorization:
        return OCPP2_0_1.IdTokenEnumType.NoAuthorization;
      default:
        throw new Error(`Unknown idToken type: ${type}`);
    }
  }

  static fromIdTokenEnumType(type: OCPP2_0_1.IdTokenEnumType): IdTokenEnumType {
    switch (type) {
      case OCPP2_0_1.IdTokenEnumType.Central:
        return IdTokenEnum.Central;
      case OCPP2_0_1.IdTokenEnumType.eMAID:
        return IdTokenEnum.eMAID;
      case OCPP2_0_1.IdTokenEnumType.ISO14443:
        return IdTokenEnum.ISO14443;
      case OCPP2_0_1.IdTokenEnumType.ISO15693:
        return IdTokenEnum.ISO15693;
      case OCPP2_0_1.IdTokenEnumType.KeyCode:
        return IdTokenEnum.KeyCode;
      case OCPP2_0_1.IdTokenEnumType.Local:
        return IdTokenEnum.Local;
      case OCPP2_0_1.IdTokenEnumType.MacAddress:
        return IdTokenEnum.MacAddress;
      case OCPP2_0_1.IdTokenEnumType.NoAuthorization:
        return IdTokenEnum.NoAuthorization;
      default:
        throw new Error(`Unknown OCPP 2.0.1 idToken type: ${type}`);
    }
  }
}
