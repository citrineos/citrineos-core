import type {CredentialsDTO} from "./models/index";
import {CredentialsToJSON} from "./models/index";
import {setAuthHeader} from "./util";
import {BaseAPI, HTTPHeaders} from "./BaseApi";
import {OcpiResponse} from "../model/OcpiResponse";
import {Credentials} from "../model/Credentials";

export interface DeleteCredentialsRequest {
    authorization: string;
}

export interface GetCredentialsRequest {
    authorization: string;
}

export interface PostCredentialsRequest {
    authorization: string;
    credentials: CredentialsDTO;
}

export interface PutCredentialsRequest {
    authorization: string;
    credentials: CredentialsDTO;
}


export class CredentialsControllerApi extends BaseAPI {

    async deleteCredentials(requestParameters: DeleteCredentialsRequest): Promise<OcpiResponse<void>> {

        BaseAPI.validateRequiredParam(requestParameters, "authorization");

        const headerParameters: HTTPHeaders = {};

        if (requestParameters["authorization"] != null) {
            headerParameters["Authorization"] = String(requestParameters["authorization"]);
        }

        setAuthHeader(headerParameters);
        return await this.request({
            path: `/ocpi/2.2/credentials`,
            method: "DELETE",
            headers: headerParameters
        });

    }

    async getCredentials(requestParameters: GetCredentialsRequest): Promise<OcpiResponse<Credentials>> {

        BaseAPI.validateRequiredParam(requestParameters, "authorization");

        const headerParameters: HTTPHeaders = {};

        if (requestParameters.authorization != null) {
            headerParameters["Authorization"] = String(requestParameters.authorization);
        }

        setAuthHeader(headerParameters);
        return await this.request({
            path: `/ocpi/2.2/credentials`,
            method: "GET",
            headers: headerParameters
        });

    }

    async postCredentials(requestParameters: PostCredentialsRequest): Promise<OcpiResponse<Credentials>> {

        BaseAPI.validateRequiredParam(requestParameters, "authorization", "credentials");

        const headerParameters: HTTPHeaders = {};

        if (requestParameters.authorization != null) {
            headerParameters["Authorization"] = String(requestParameters.authorization);
        }

        setAuthHeader(headerParameters);
        return await this.request({
            path: `/ocpi/2.2/credentials`,
            method: "POST",
            headers: headerParameters,
            body: CredentialsToJSON(requestParameters.credentials),
        });

    }

    async putCredentials(requestParameters: PutCredentialsRequest): Promise<OcpiResponse<Credentials>> {

        BaseAPI.validateRequiredParam(requestParameters, "authorization", "credentials");

        const headerParameters: HTTPHeaders = {};

        if (requestParameters.authorization != null) {
            headerParameters["Authorization"] = String(requestParameters.authorization);
        }

        setAuthHeader(headerParameters);
        return await this.request({
            path: `/ocpi/2.2/credentials`,
            method: "PUT",
            headers: headerParameters,
            body: CredentialsToJSON(requestParameters.credentials),
        });

    }

}
