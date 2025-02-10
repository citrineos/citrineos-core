import {
    OCPP2_0_1
} from "@citrineos/base";
import {AdditionalInfo, Authorization, IdToken} from "../../model/Authorization";

export class AuthenticationMapper {

    static toAuthorizationData(authorization: Authorization): OCPP2_0_1.AuthorizationData {
        return {
            customData: authorization.customData,
            idToken: AuthenticationMapper.toIdToken(authorization.idToken),
            idTokenInfo: AuthenticationMapper.toIdTokenInfo(authorization),
        }
    }

    static toIdToken(idToken: IdToken) {
        return {
            customData: idToken.customData,
            additionalInfo: idToken.additionalInfo && idToken.additionalInfo.length > 0
                ? ([idToken.additionalInfo.map(this.toAdditionalInfo)] as [any, ...any[]])
                : null,
            idToken: idToken.idToken,
            type: AuthenticationMapper.toIdTokenEnumType(idToken.type),
        }
    }

    static toAdditionalInfo(additionalInfo: AdditionalInfo) {
        return {
            customData: additionalInfo.customData,
            additionalIdToken: additionalInfo.additionalIdToken,
            type: additionalInfo.type
        }
    }

    static toIdTokenInfo(authorization: Authorization) {
        return {
            status: AuthenticationMapper.toAuthorizationStatusEnumType(authorization.idTokenInfo!.status),
            cacheExpiryDateTime:
            authorization.idTokenInfo?.cacheExpiryDateTime,
            chargingPriority: authorization.idTokenInfo?.chargingPriority,
            language1: authorization.idTokenInfo?.language1,
            evseId: authorization.idTokenInfo?.evseId,
            groupIdToken: authorization.idTokenInfo?.groupIdToken
                ? AuthenticationMapper.toIdToken(authorization.idTokenInfo?.groupIdToken)
                : undefined,
            language2: authorization.idTokenInfo?.language2,
            personalMessage: authorization.idTokenInfo?.personalMessage,
        };
    }

    static toMessageContentType(messageContent: any) {
        return {
            customData: messageContent.customData,
            format: AuthenticationMapper.toMessageFormatEnum(messageContent.format),
            language: messageContent.language,
            content: messageContent.content
        }
    }

    static toMessageFormatEnum(messageFormat: string) {
        switch (messageFormat) {
            case "ASCII":
                return OCPP2_0_1.MessageFormatEnumType.ASCII;
            case "HTML":
                return OCPP2_0_1.MessageFormatEnumType.HTML;
            case "URI":
                return OCPP2_0_1.MessageFormatEnumType.URI;
            case "UTF8":
                return OCPP2_0_1.MessageFormatEnumType.UTF8;
            default:
                throw new Error('Unknown message format');
        }
    }

    static toAuthorizationStatusEnumType(status: string) {
        switch (status) {
            case "Accepted":
                return OCPP2_0_1.AuthorizationStatusEnumType.Accepted;
            case "Blocked":
                return OCPP2_0_1.AuthorizationStatusEnumType.Blocked;
            case "ConcurrentTx":
                return OCPP2_0_1.AuthorizationStatusEnumType.ConcurrentTx;
            case "Expired":
                return OCPP2_0_1.AuthorizationStatusEnumType.Expired;
            case "Invalid":
                return OCPP2_0_1.AuthorizationStatusEnumType.Invalid;
            case "NoCredit":
                return OCPP2_0_1.AuthorizationStatusEnumType.NoCredit;
            case "NotAllowedTypeEVSE":
                return OCPP2_0_1.AuthorizationStatusEnumType.NotAllowedTypeEVSE;
            case "NotAtThisLocation":
                return OCPP2_0_1.AuthorizationStatusEnumType.NotAtThisLocation;
            case "NotAtThisTime":
                return OCPP2_0_1.AuthorizationStatusEnumType.NotAtThisTime;
            case "Unknown":
                return OCPP2_0_1.AuthorizationStatusEnumType.Unknown;
            default:
                throw new Error('Unknown authorization status');
        }
    }

    static toIdTokenEnumType(type: string) {
        switch (type) {
            case "Central":
                return OCPP2_0_1.IdTokenEnumType.Central;
            case "eMAID":
                return OCPP2_0_1.IdTokenEnumType.eMAID;
            case "ISO14443":
                return OCPP2_0_1.IdTokenEnumType.ISO14443;
            case "ISO15693":
                return OCPP2_0_1.IdTokenEnumType.ISO15693;
            case "KeyCode":
                return OCPP2_0_1.IdTokenEnumType.KeyCode;
            case "Local":
                return OCPP2_0_1.IdTokenEnumType.Local;
            case "MacAddress":
                return OCPP2_0_1.IdTokenEnumType.MacAddress;
            case "NoAuthorization":
                return OCPP2_0_1.IdTokenEnumType.NoAuthorization;
            default:
                throw new Error('Unknown idToken type');
        }
    }
}

