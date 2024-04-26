import type {SetChargingProfileDTO,} from "./models/index";
import {BaseOcpiHeaders, setAuthHeader, validateAndgetOcpiHeaders} from "./util";
import {BaseAPI, HTTPHeaders} from "./BaseApi";
import {ChargingProfileResponse} from "../model/ChargingProfileResponse";
import {OcpiResponse} from "../model/OcpiResponse";

export interface DeleteReceiverChargingProfileRequest extends BaseOcpiHeaders {
    sessionId: string;
    responseUrl: string;
}

export interface GetReceiverChargingProfileRequest extends BaseOcpiHeaders {
    sessionId: string;
    duration: number;
    responseUrl: string;
}

export interface PutReceiverChargingProfileRequest extends BaseOcpiHeaders {
    sessionId: string;
    setChargingProfile: SetChargingProfileDTO;
}


export class ChargingProfilesControllerApi extends BaseAPI {

    async deleteReceiverChargingProfile(requestParameters: DeleteReceiverChargingProfileRequest): Promise<OcpiResponse<void>> {

        BaseAPI.validateRequiredParam(requestParameters, "sessionId", "responseUrl");

        const queryParameters: any = {};

        if (requestParameters.responseUrl != null) {
            queryParameters["response_url"] = requestParameters.responseUrl;
        }

        const headerParameters: HTTPHeaders = validateAndgetOcpiHeaders(requestParameters);

        setAuthHeader(headerParameters);
        return await this.request({
            path: `/ocpi/2.2/receiver/chargingprofiles/{sessionId}`
                .replace(`{${"sessionId"}}`, encodeURIComponent(String(requestParameters.sessionId))),
            method: "DELETE",
            headers: headerParameters,
            query: queryParameters,
        });

    }

    async getReceiverChargingProfile(requestParameters: GetReceiverChargingProfileRequest): Promise<OcpiResponse<ChargingProfileResponse>> {

        BaseAPI.validateRequiredParam(requestParameters, "sessionId", "duration", "responseUrl");

        const queryParameters: any = {};

        if (requestParameters.duration != null) {
            queryParameters["duration"] = requestParameters.duration;
        }

        if (requestParameters.responseUrl != null) {
            queryParameters["response_url"] = requestParameters.responseUrl;
        }

        const headerParameters: HTTPHeaders = validateAndgetOcpiHeaders(requestParameters);

        setAuthHeader(headerParameters);
        return await this.request({
            path: `/ocpi/2.2/receiver/chargingprofiles/{sessionId}`
                .replace(`{${"sessionId"}}`, encodeURIComponent(String(requestParameters.sessionId))),
            method: "GET",
            headers: headerParameters,
            query: queryParameters,
        });

    }

    async putReceiverChargingProfile(requestParameters: PutReceiverChargingProfileRequest): Promise<OcpiResponse<void>> {

        BaseAPI.validateRequiredParam(requestParameters, "sessionId", "setChargingProfile");

        const headerParameters: HTTPHeaders = validateAndgetOcpiHeaders(requestParameters);

        setAuthHeader(headerParameters);
        return await this.request({
            path: `/ocpi/2.2/receiver/chargingprofiles/{sessionId}`
                .replace(`{${"sessionId"}}`, encodeURIComponent(String(requestParameters.sessionId))),
            method: "PUT",
            headers: headerParameters,
            body: requestParameters.setChargingProfile,
        });

    }

}
