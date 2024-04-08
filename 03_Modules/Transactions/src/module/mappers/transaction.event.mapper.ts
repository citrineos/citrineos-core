import {singleton} from "tsyringe";
import {Authorization} from "@citrineos/data";
import {AdditionalInfoType, IdTokenInfoType, IdTokenType} from "@citrineos/base";

@singleton()
export class TransactionEventMapper {

    mapAuthorizationToIdTokenInfo(authorization: Authorization): IdTokenInfoType {
        const groupIdToken = this.mapGroupIdToken(authorization);
        return {
            status: authorization.idTokenInfo?.status,
            cacheExpiryDateTime: authorization.idTokenInfo?.cacheExpiryDateTime,
            chargingPriority: authorization.idTokenInfo?.chargingPriority,
            language1: authorization.idTokenInfo?.language1,
            evseId: authorization.idTokenInfo?.evseId,
            groupIdToken: groupIdToken,
            language2: authorization.idTokenInfo?.language2,
            personalMessage: authorization.idTokenInfo?.personalMessage,
        } as IdTokenInfoType;
    }

    mapAuthorizationInfo(
        authorization: Authorization
    ): [AdditionalInfoType, ...AdditionalInfoType[]] | undefined {
        let authorizationInfo:
            | [AdditionalInfoType, ...AdditionalInfoType[]]
            | undefined = undefined;
        const authorizationAdditionalInfo =
            authorization.idTokenInfo?.groupIdToken?.additionalInfo;
        if (authorizationAdditionalInfo && authorizationAdditionalInfo.length > 0) {
            authorizationInfo = authorizationAdditionalInfo.map((additionalInfo) => ({
                additionalIdToken: additionalInfo.additionalIdToken,
                type: additionalInfo.type,
            })) as [AdditionalInfoType, ...AdditionalInfoType[]];
        }
        return authorizationInfo;
    }

    private mapGroupIdToken(authorization: Authorization): IdTokenType | undefined {
        const authorizationInfo:
            | undefined
            | [AdditionalInfoType, ...AdditionalInfoType[]] =
            this.mapAuthorizationInfo(authorization);
        const authorizationGroupIdToken = authorization.idTokenInfo?.groupIdToken;
        let groupIdToken: IdTokenType | undefined = undefined;
        if (authorizationGroupIdToken) {
            groupIdToken = {
                additionalInfo: authorizationInfo,
                idToken: authorizationGroupIdToken.idToken,
                type: authorizationGroupIdToken.type,
            };
        }
        return groupIdToken;
    }

}
