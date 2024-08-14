import {IdTokenType} from "./AuthorizeRequest";

export interface UpdateLocalAuthListRequest {
    idTokens: IdTokenType[];
    overwrite?: boolean;
}
