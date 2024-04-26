import type {TariffDTO} from "./models/index";
import {TariffToJSON,} from "./models/index";
import {BaseOcpiHeaders, setAuthHeader, validateAndgetOcpiHeaders} from "./util";
import {BaseAPI, HTTPHeaders} from "./BaseApi";
import {OcpiResponse} from "../model/OcpiResponse";
import {Tariff} from "../model/Tariff";

export interface DeleteTariffRequest extends BaseOcpiHeaders {
    countryCode: string;
    partyID: string;
    tariffID: string;
}

export interface GetTariffRequest extends BaseOcpiHeaders {
    countryCode: string;
    partyID: string;
    tariffID: string;
}

export interface PutTariffRequest extends BaseOcpiHeaders {
    countryCode: string;
    partyID: string;
    tariffID: string;
    tariff: TariffDTO;
}


export class TariffsControllerApi extends BaseAPI {

    async deleteTariff(requestParameters: DeleteTariffRequest): Promise<OcpiResponse<void>> {

        BaseAPI.validateRequiredParam(requestParameters, "countryCode", "partyID", "tariffID");

        const headerParameters: HTTPHeaders = validateAndgetOcpiHeaders(requestParameters);

        setAuthHeader(headerParameters);
        return await this.request({
            path: `/ocpi/receiver/2.2/tariffs/{countryCode}/{partyID}/{tariffID}`
                .replace(`{${"countryCode"}}`, encodeURIComponent(String(requestParameters.countryCode)))
                .replace(`{${"partyID"}}`, encodeURIComponent(String(requestParameters.partyID)))
                .replace(`{${"tariffID"}}`, encodeURIComponent(String(requestParameters.tariffID))),
            method: "DELETE",
            headers: headerParameters
        });

    }

    async getTariff(requestParameters: GetTariffRequest): Promise<OcpiResponse<Tariff>> {

        BaseAPI.validateRequiredParam(requestParameters, "countryCode", "partyID", "tariffID");

        const headerParameters: HTTPHeaders = validateAndgetOcpiHeaders(requestParameters);

        setAuthHeader(headerParameters);
        return await this.request({
            path: `/ocpi/receiver/2.2/tariffs/{countryCode}/{partyID}/{tariffID}`
                .replace(`{${"countryCode"}}`, encodeURIComponent(String(requestParameters.countryCode)))
                .replace(`{${"partyID"}}`, encodeURIComponent(String(requestParameters.partyID)))
                .replace(`{${"tariffID"}}`, encodeURIComponent(String(requestParameters.tariffID))),
            method: "GET",
            headers: headerParameters
        });

    }

    async putTariff(requestParameters: PutTariffRequest): Promise<OcpiResponse<void>> {

        BaseAPI.validateRequiredParam(requestParameters, "countryCode", "partyID", "tariffID", "tariff");

        const headerParameters: HTTPHeaders = validateAndgetOcpiHeaders(requestParameters);

        setAuthHeader(headerParameters);
        return await this.request({
            path: `/ocpi/receiver/2.2/tariffs/{countryCode}/{partyID}/{tariffID}`
                .replace(`{${"countryCode"}}`, encodeURIComponent(String(requestParameters.countryCode)))
                .replace(`{${"partyID"}}`, encodeURIComponent(String(requestParameters.partyID)))
                .replace(`{${"tariffID"}}`, encodeURIComponent(String(requestParameters.tariffID))),
            method: "PUT",
            headers: headerParameters,
            body: TariffToJSON(requestParameters.tariff),
        });

    }

}
