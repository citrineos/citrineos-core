import {BaseOcpiHeaders, setAuthHeader, validateAndgetOcpiHeaders} from "./util";
import {BaseAPI, HTTPHeaders} from "./BaseApi";
import {Cdr} from "../model/Cdr";
import {OcpiResponse} from "../model/OcpiResponse";

export interface GetCdrRequest extends BaseOcpiHeaders {
    cdrID: string;
}

export interface PostCdrRequest extends BaseOcpiHeaders {
    cDR: Cdr;
}


export class CdrsControllerApi extends BaseAPI {


    async getCdr(requestParameters: GetCdrRequest): Promise<OcpiResponse<Cdr>> {

        BaseAPI.validateRequiredParam(requestParameters, "cdrID");

        const headerParameters: HTTPHeaders = validateAndgetOcpiHeaders(requestParameters);

        setAuthHeader(headerParameters);
        return await this.request({
            path: `/ocpi/receiver/2.2/cdrs/{cdrID}`.replace(`{${"cdrID"}}`, encodeURIComponent(String(requestParameters.cdrID))),
            method: "GET",
            headers: headerParameters
        });

    }


    async postCdr(requestParameters: PostCdrRequest): Promise<OcpiResponse<Cdr>> {

        BaseAPI.validateRequiredParam(requestParameters, "cDR");

        const headerParameters: HTTPHeaders = validateAndgetOcpiHeaders(requestParameters);

        setAuthHeader(headerParameters);
        return await this.request({
            path: `/ocpi/receiver/2.2/cdrs`,
            method: "POST",
            headers: headerParameters,
            body: requestParameters["cDR"],
        });

    }


}
