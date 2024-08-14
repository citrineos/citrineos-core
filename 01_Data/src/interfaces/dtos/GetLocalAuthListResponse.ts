import {IdTokenType} from "@citrineos/base/dist/ocpp/model/types/AuthorizeRequest";

export class GetLocalAuthListResponse {
    declare version: number
    declare idTokens: IdTokenType[]
}
