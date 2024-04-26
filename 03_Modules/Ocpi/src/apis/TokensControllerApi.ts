import type {TokenDTO,} from "./models/index";
import {TokenToJSON,} from "./models/index";
import {BaseOcpiHeaders, setAuthHeader, validateAndgetOcpiHeaders} from "./util";
import {BaseAPI, HTTPHeaders} from "./BaseApi";
import {OcpiResponse} from "../model/OcpiResponse";
import {Token} from "../model/Token";
import {TokenType} from "../model/TokenType";

export interface GetTokenRequest extends BaseOcpiHeaders {
    countryCode: string;
    partyID: string;
    tokenUID: string;
    type?: TokenType;
}

export interface PatchTokenRequest extends BaseOcpiHeaders {
    countryCode: string;
    partyID: string;
    tokenUID: string;
    requestBody: { [key: string]: object; };
    type?: TokenType;
}

export interface PutTokenRequest extends BaseOcpiHeaders {
    countryCode: string;
    partyID: string;
    tokenUID: string;
    token: TokenDTO;
    type?: TokenType;
}


export class TokensControllerApi extends BaseAPI {

    async getToken(requestParameters: GetTokenRequest): Promise<OcpiResponse<Token>> {

        BaseAPI.validateRequiredParam(requestParameters, "countryCode", "partyID", "tokenUID");

        const queryParameters: any = {};

        if (requestParameters.type != null) {
            queryParameters["type"] = requestParameters.type;
        }

        const headerParameters: HTTPHeaders = validateAndgetOcpiHeaders(requestParameters);

        setAuthHeader(headerParameters);
        return await this.request({
            path: `/ocpi/receiver/2.2/tokens/{countryCode}/{partyID}/{tokenUID}`
                .replace(`{${"countryCode"}}`, encodeURIComponent(String(requestParameters.countryCode)))
                .replace(`{${"partyID"}}`, encodeURIComponent(String(requestParameters.partyID)))
                .replace(`{${"tokenUID"}}`, encodeURIComponent(String(requestParameters.tokenUID))),
            method: "GET",
            headers: headerParameters,
            query: queryParameters,
        });

    }

    async patchToken(requestParameters: PatchTokenRequest): Promise<OcpiResponse<void>> {

        BaseAPI.validateRequiredParam(requestParameters, "countryCode", "partyID", "tokenUID", "requestBody");

        const queryParameters: any = {};

        if (requestParameters.type != null) {
            queryParameters["type"] = requestParameters.type;
        }

        const headerParameters: HTTPHeaders = validateAndgetOcpiHeaders(requestParameters);

        setAuthHeader(headerParameters);
        return await this.request({
            path: `/ocpi/receiver/2.2/tokens/{countryCode}/{partyID}/{tokenUID}`
                .replace(`{${"countryCode"}}`, encodeURIComponent(String(requestParameters.countryCode)))
                .replace(`{${"partyID"}}`, encodeURIComponent(String(requestParameters.partyID)))
                .replace(`{${"tokenUID"}}`, encodeURIComponent(String(requestParameters.tokenUID))),
            method: "PATCH",
            headers: headerParameters,
            query: queryParameters,
            body: requestParameters.requestBody,
        });

    }

    async putToken(requestParameters: PutTokenRequest): Promise<OcpiResponse<void>> {

        BaseAPI.validateRequiredParam(requestParameters, "countryCode", "partyID", "tokenUID", "token");

        const queryParameters: any = {};

        if (requestParameters.type != null) {
            queryParameters["type"] = requestParameters.type;
        }

        const headerParameters: HTTPHeaders = validateAndgetOcpiHeaders(requestParameters);

        setAuthHeader(headerParameters);
        return await this.request({
            path: `/ocpi/receiver/2.2/tokens/{countryCode}/{partyID}/{tokenUID}`
                .replace(`{${"countryCode"}}`, encodeURIComponent(String(requestParameters.countryCode)))
                .replace(`{${"partyID"}}`, encodeURIComponent(String(requestParameters.partyID)))
                .replace(`{${"tokenUID"}}`, encodeURIComponent(String(requestParameters.tokenUID))),
            method: "PUT",
            headers: headerParameters,
            query: queryParameters,
            body: TokenToJSON(requestParameters.token),
        });

    }
}
