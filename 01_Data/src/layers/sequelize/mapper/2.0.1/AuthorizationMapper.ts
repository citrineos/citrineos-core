// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { AuthorizationStatusType, IdTokenType } from '@citrineos/base';
import { OCPP2_0_1 } from '@citrineos/base';
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
      status: AuthorizationMapper.fromAuthorizationStatusType(authorization.status),
      cacheExpiryDateTime: authorization.cacheExpiryDateTime,
      chargingPriority: authorization.chargingPriority,
      language1: authorization.language1,
      language2: authorization.language2,
      personalMessage: authorization.personalMessage,
      customData: authorization.customData,
    };
  }

  // Rest stays the same...
  static fromAuthorizationStatusType(
    status: AuthorizationStatusType,
  ): OCPP2_0_1.AuthorizationStatusEnumType {
    switch (status) {
      case 'Accepted':
        return OCPP2_0_1.AuthorizationStatusEnumType.Accepted;
      case 'Blocked':
        return OCPP2_0_1.AuthorizationStatusEnumType.Blocked;
      case 'ConcurrentTx':
        return OCPP2_0_1.AuthorizationStatusEnumType.ConcurrentTx;
      case 'Expired':
        return OCPP2_0_1.AuthorizationStatusEnumType.Expired;
      case 'Invalid':
        return OCPP2_0_1.AuthorizationStatusEnumType.Invalid;
      case 'NoCredit':
        return OCPP2_0_1.AuthorizationStatusEnumType.NoCredit;
      case 'NotAllowedTypeEVSE':
        return OCPP2_0_1.AuthorizationStatusEnumType.NotAllowedTypeEVSE;
      case 'NotAtThisLocation':
        return OCPP2_0_1.AuthorizationStatusEnumType.NotAtThisLocation;
      case 'NotAtThisTime':
        return OCPP2_0_1.AuthorizationStatusEnumType.NotAtThisTime;
      case 'Unknown':
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
        return 'Accepted';
      case OCPP2_0_1.AuthorizationStatusEnumType.Blocked:
        return 'Blocked';
      case OCPP2_0_1.AuthorizationStatusEnumType.ConcurrentTx:
        return 'ConcurrentTx';
      case OCPP2_0_1.AuthorizationStatusEnumType.Expired:
        return 'Expired';
      case OCPP2_0_1.AuthorizationStatusEnumType.Invalid:
        return 'Invalid';
      case OCPP2_0_1.AuthorizationStatusEnumType.NoCredit:
        return 'NoCredit';
      case OCPP2_0_1.AuthorizationStatusEnumType.NotAllowedTypeEVSE:
        return 'NotAllowedTypeEVSE';
      case OCPP2_0_1.AuthorizationStatusEnumType.NotAtThisLocation:
        return 'NotAtThisLocation';
      case OCPP2_0_1.AuthorizationStatusEnumType.NotAtThisTime:
        return 'NotAtThisTime';
      case OCPP2_0_1.AuthorizationStatusEnumType.Unknown:
        return 'Unknown';
      default:
        throw new Error('Unknown authorization status');
    }
  }

  static toIdTokenEnumType(type: IdTokenType): OCPP2_0_1.IdTokenEnumType {
    switch (type) {
      case 'Central':
      case 'Other':
        return OCPP2_0_1.IdTokenEnumType.Central;
      case 'eMAID':
        return OCPP2_0_1.IdTokenEnumType.eMAID;
      case 'ISO14443':
        return OCPP2_0_1.IdTokenEnumType.ISO14443;
      case 'ISO15693':
        return OCPP2_0_1.IdTokenEnumType.ISO15693;
      case 'KeyCode':
        return OCPP2_0_1.IdTokenEnumType.KeyCode;
      case 'Local':
        return OCPP2_0_1.IdTokenEnumType.Local;
      case 'MacAddress':
        return OCPP2_0_1.IdTokenEnumType.MacAddress;
      case 'NoAuthorization':
        return OCPP2_0_1.IdTokenEnumType.NoAuthorization;
      default:
        throw new Error(`Unknown idToken type: ${type}`);
    }
  }

  static fromIdTokenEnumType(type: OCPP2_0_1.IdTokenEnumType): IdTokenType {
    switch (type) {
      case OCPP2_0_1.IdTokenEnumType.Central:
        return 'Central';
      case OCPP2_0_1.IdTokenEnumType.eMAID:
        return 'eMAID';
      case OCPP2_0_1.IdTokenEnumType.ISO14443:
        return 'ISO14443';
      case OCPP2_0_1.IdTokenEnumType.ISO15693:
        return 'ISO15693';
      case OCPP2_0_1.IdTokenEnumType.KeyCode:
        return 'KeyCode';
      case OCPP2_0_1.IdTokenEnumType.Local:
        return 'Local';
      case OCPP2_0_1.IdTokenEnumType.MacAddress:
        return 'MacAddress';
      case OCPP2_0_1.IdTokenEnumType.NoAuthorization:
        return 'NoAuthorization';
      default:
        throw new Error(`Unknown OCPP 2.0.1 idToken type: ${type}`);
    }
  }
}
