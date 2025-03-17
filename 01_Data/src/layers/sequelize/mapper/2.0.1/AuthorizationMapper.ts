import { OCPP2_0_1 } from '@citrineos/base';
import { AdditionalInfo, Authorization, IdToken } from '../../model/Authorization';

export class AuthorizationMapper {
  static toAuthorizationData(authorization: Authorization): OCPP2_0_1.AuthorizationData {
    return {
      customData: authorization.customData,
      idToken: AuthorizationMapper.toIdToken(authorization.idToken),
      idTokenInfo: AuthorizationMapper.toIdTokenInfo(authorization),
    };
  }

  static toIdToken(idToken: IdToken): OCPP2_0_1.IdTokenType {
    if (!idToken.type) {
      throw new Error('IdToken type is missing.');
    }
    return {
      customData: idToken.customData,
      additionalInfo:
        idToken.additionalInfo && idToken.additionalInfo.length > 0
          ? (idToken.additionalInfo.map(this.toAdditionalInfo) as [any, ...any[]])
          : null,
      idToken: idToken.idToken,
      type: AuthorizationMapper.toIdTokenEnumType(idToken.type),
    };
  }

  static toAdditionalInfo(additionalInfo: AdditionalInfo): OCPP2_0_1.AdditionalInfoType {
    return {
      customData: additionalInfo.customData,
      additionalIdToken: additionalInfo.additionalIdToken,
      type: additionalInfo.type,
    };
  }

  static toIdTokenInfo(authorization: Authorization): OCPP2_0_1.IdTokenInfoType {
    return {
      status: AuthorizationMapper.toAuthorizationStatusEnumType(authorization.idTokenInfo!.status),
      cacheExpiryDateTime: authorization.idTokenInfo?.cacheExpiryDateTime,
      chargingPriority: authorization.idTokenInfo?.chargingPriority,
      language1: authorization.idTokenInfo?.language1,
      evseId: authorization.idTokenInfo?.evseId,
      groupIdToken: authorization.idTokenInfo?.groupIdToken
        ? AuthorizationMapper.toIdToken(authorization.idTokenInfo?.groupIdToken)
        : undefined,
      language2: authorization.idTokenInfo?.language2,
      personalMessage: authorization.idTokenInfo?.personalMessage,
      customData: authorization.idTokenInfo?.customData,
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

  static toAuthorizationStatusEnumType(status: string): OCPP2_0_1.AuthorizationStatusEnumType {
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

  static toIdTokenEnumType(type: string): OCPP2_0_1.IdTokenEnumType {
    switch (type) {
      case 'Central':
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
        throw new Error('Unknown idToken type');
    }
  }
}
