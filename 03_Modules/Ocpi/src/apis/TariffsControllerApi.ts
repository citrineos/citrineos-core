import {BaseOcpiHeaders, setAuthHeader, validateAndgetOcpiHeaders} from './util';
import {BaseAPI, HTTPHeaders} from './BaseApi';
import {OcpiResponse} from '../model/OcpiResponse';
import {Tariff} from '../model/Tariff';
import {VersionNumber} from '../model/VersionNumber';

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
    tariff: Tariff;
}


export class TariffsControllerApi extends BaseAPI {

    async deleteTariff(requestParameters: DeleteTariffRequest, versionId: string = VersionNumber.TWO_DOT_TWO_DOT_ONE): Promise<OcpiResponse<void>> {

        BaseAPI.validateRequiredParam(requestParameters, 'countryCode', 'partyID', 'tariffID');

        const headerParameters: HTTPHeaders = validateAndgetOcpiHeaders(requestParameters);

        setAuthHeader(headerParameters);
        return await this.request({
            path: `/ocpi/receiver/${versionId}/tariffs/{countryCode}/{partyID}/{tariffID}`
                .replace(`{${'countryCode'}}`, encodeURIComponent(String(requestParameters.countryCode)))
                .replace(`{${'partyID'}}`, encodeURIComponent(String(requestParameters.partyID)))
                .replace(`{${'tariffID'}}`, encodeURIComponent(String(requestParameters.tariffID))),
            method: 'DELETE',
            headers: headerParameters
        });

    }

    async getTariff(requestParameters: GetTariffRequest, versionId: string = VersionNumber.TWO_DOT_TWO_DOT_ONE): Promise<OcpiResponse<Tariff>> {

        BaseAPI.validateRequiredParam(requestParameters, 'countryCode', 'partyID', 'tariffID');

        const headerParameters: HTTPHeaders = validateAndgetOcpiHeaders(requestParameters);

        setAuthHeader(headerParameters);
        return await this.request({
            path: `/ocpi/receiver/${versionId}/tariffs/{countryCode}/{partyID}/{tariffID}`
                .replace(`{${'countryCode'}}`, encodeURIComponent(String(requestParameters.countryCode)))
                .replace(`{${'partyID'}}`, encodeURIComponent(String(requestParameters.partyID)))
                .replace(`{${'tariffID'}}`, encodeURIComponent(String(requestParameters.tariffID))),
            method: 'GET',
            headers: headerParameters
        });

    }

    async putTariff(requestParameters: PutTariffRequest, versionId: string = VersionNumber.TWO_DOT_TWO_DOT_ONE): Promise<OcpiResponse<void>> {

        BaseAPI.validateRequiredParam(requestParameters, 'countryCode', 'partyID', 'tariffID', 'tariff');

        const headerParameters: HTTPHeaders = validateAndgetOcpiHeaders(requestParameters);

        setAuthHeader(headerParameters);
        return await this.request({
            path: `/ocpi/receiver/${versionId}/tariffs/{countryCode}/{partyID}/{tariffID}`
                .replace(`{${'countryCode'}}`, encodeURIComponent(String(requestParameters.countryCode)))
                .replace(`{${'partyID'}}`, encodeURIComponent(String(requestParameters.partyID)))
                .replace(`{${'tariffID'}}`, encodeURIComponent(String(requestParameters.tariffID))),
            method: 'PUT',
            headers: headerParameters,
            body: requestParameters.tariff,
        });

    }

}
