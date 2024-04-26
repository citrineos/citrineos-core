import {BaseAPI, HTTPHeaders} from "./BaseApi";
import {setAuthHeader} from "./util";
import {OcpiResponse} from "../model/OcpiResponse";
import {VersionDetails} from "../model/VersionDetails";
import {Version} from "../model/Version";

export interface GetVersionRequest {
    authorization: string;
}

export interface GetVersionsRequest {
    authorization: string;
}


export class VersionsControllerApi extends BaseAPI {

    async getVersion(requestParameters: GetVersionRequest): Promise<OcpiResponse<VersionDetails>> {

        BaseAPI.validateRequiredParam(requestParameters, "authorization");

        const headerParameters: HTTPHeaders = {};

        if (requestParameters.authorization != null) {
            headerParameters["Authorization"] = String(requestParameters.authorization);
        }

        setAuthHeader(headerParameters);
        return await this.request({
            path: `/ocpi/2.2`,
            method: "GET",
            headers: headerParameters
        });

    }

    /**
     * This endpoint lists all the available OCPI versions and the corresponding URLs to where version specific details such as the supported endpoints can be found.
     */
    async getVersions(requestParameters: GetVersionsRequest): Promise<OcpiResponse<Version>> {
        BaseAPI.validateRequiredParam(requestParameters, "authorization");

        const headerParameters: HTTPHeaders = {};

        if (requestParameters.authorization != null) {
            headerParameters["Authorization"] = String(requestParameters.authorization);
        }

        setAuthHeader(headerParameters);
        return await this.request({
            path: `/ocpi/versions`,
            method: "GET",
            headers: headerParameters
        });

    }

}
