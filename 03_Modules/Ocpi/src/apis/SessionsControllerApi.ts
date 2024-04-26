import type {SessionDTO,} from "./models/index";
import {SessionToJSON,} from "./models/index";
import {BaseOcpiHeaders, setAuthHeader, validateAndgetOcpiHeaders} from "./util";
import {BaseAPI, HTTPHeaders} from "./BaseApi";
import {OcpiResponse} from "../model/OcpiResponse";
import {Session} from "../model/Session";

export interface GetSessionRequest extends BaseOcpiHeaders {
    countryCode: string;
    partyID: string;
    sessionID: string;
}

export interface PatchSessionRequest extends BaseOcpiHeaders {
    countryCode: string;
    partyID: string;
    sessionID: string;
    requestBody: { [key: string]: object; };
}


export interface PutSessionRequest extends BaseOcpiHeaders {
    countryCode: string;
    partyID: string;
    sessionID: string;
    session: SessionDTO;
}


export class SessionsControllerApi extends BaseAPI {

    async getSession(requestParameters: GetSessionRequest): Promise<OcpiResponse<Session>> {

        BaseAPI.validateRequiredParam(requestParameters, "countryCode", "partyID", "sessionID");

        const headerParameters: HTTPHeaders = validateAndgetOcpiHeaders(requestParameters);

        setAuthHeader(headerParameters);
        return await this.request({
            path: `/ocpi/receiver/2.2/sessions/{countryCode}/{partyID}/{sessionID}`
                .replace(`{${"countryCode"}}`, encodeURIComponent(String(requestParameters.countryCode)))
                .replace(`{${"partyID"}}`, encodeURIComponent(String(requestParameters.partyID)))
                .replace(`{${"sessionID"}}`, encodeURIComponent(String(requestParameters.sessionID))),
            method: "GET",
            headers: headerParameters
        });

    }

    async patchSession(requestParameters: PatchSessionRequest): Promise<OcpiResponse<void>> {

        BaseAPI.validateRequiredParam(requestParameters, "countryCode", "partyID", "sessionID", "requestBody");

        const headerParameters: HTTPHeaders = validateAndgetOcpiHeaders(requestParameters);

        setAuthHeader(headerParameters);
        return await this.request({
            path: `/ocpi/receiver/2.2/sessions/{countryCode}/{partyID}/{sessionID}`
                .replace(`{${"countryCode"}}`, encodeURIComponent(String(requestParameters.countryCode)))
                .replace(`{${"partyID"}}`, encodeURIComponent(String(requestParameters.partyID)))
                .replace(`{${"sessionID"}}`, encodeURIComponent(String(requestParameters.sessionID))),
            method: "PATCH",
            headers: headerParameters,
            body: requestParameters.requestBody,
        });

    }

    async putSession(requestParameters: PutSessionRequest): Promise<OcpiResponse<void>> {

        BaseAPI.validateRequiredParam(requestParameters, "countryCode", "partyID", "sessionID", "session");

        const headerParameters: HTTPHeaders = validateAndgetOcpiHeaders(requestParameters);

        setAuthHeader(headerParameters);
        return await this.request({
            path: `/ocpi/receiver/2.2/sessions/{countryCode}/{partyID}/{sessionID}`
                .replace(`{${"countryCode"}}`, encodeURIComponent(String(requestParameters.countryCode)))
                .replace(`{${"partyID"}}`, encodeURIComponent(String(requestParameters.partyID)))
                .replace(`{${"sessionID"}}`, encodeURIComponent(String(requestParameters.sessionID))),
            method: "PUT",
            headers: headerParameters,
            body: SessionToJSON(requestParameters.session),
        });

    }

}
