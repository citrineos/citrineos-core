import {
  OcpiParams,
  setAuthHeader,
  getOcpiHeaders,
} from './util';
import { BaseAPI, HTTPHeaders } from './BaseApi';
import { OcpiResponse } from '../util/ocpi.response';
import { Tariff } from '../model/Tariff';
import { VersionNumber } from '../model/VersionNumber';

export interface DeleteTariffRequest extends OcpiParams {
  countryCode: string;
  partyID: string;
  tariffID: string;
}

export interface GetTariffRequest extends OcpiParams {
  countryCode: string;
  partyID: string;
  tariffID: string;
}

export interface PutTariffRequest extends OcpiParams {
  countryCode: string;
  partyID: string;
  tariffID: string;
  tariff: Tariff;
}

export class TariffsControllerApi extends BaseAPI {
  async deleteTariff(
    requestParameters: DeleteTariffRequest,
    versionId: string = VersionNumber.TWO_DOT_TWO_DOT_ONE,
  ): Promise<OcpiResponse<void>> {
    this.validateRequiredParam(
      requestParameters,
      'countryCode',
      'partyID',
      'tariffID',
    );

    const headerParameters: HTTPHeaders =
      getOcpiHeaders(requestParameters);

    setAuthHeader(headerParameters);
    return await this.request({
      path: `${this.getBasePath(versionId)}/tariffs/{countryCode}/{partyID}/{tariffID}`
        .replace(
          `{${'countryCode'}}`,
          encodeURIComponent(String(requestParameters.countryCode)),
        )
        .replace(
          `{${'partyID'}}`,
          encodeURIComponent(String(requestParameters.partyID)),
        )
        .replace(
          `{${'tariffID'}}`,
          encodeURIComponent(String(requestParameters.tariffID)),
        ),
      method: 'DELETE',
      headers: headerParameters,
    });
  }

  async getTariff(
    requestParameters: GetTariffRequest,
    versionId: string = VersionNumber.TWO_DOT_TWO_DOT_ONE,
  ): Promise<OcpiResponse<Tariff>> {
    this.validateRequiredParam(
      requestParameters,
      'countryCode',
      'partyID',
      'tariffID',
    );

    const headerParameters: HTTPHeaders =
      getOcpiHeaders(requestParameters);

    setAuthHeader(headerParameters);
    return await this.request({
      path: `${this.getBasePath(versionId)}/tariffs/{countryCode}/{partyID}/{tariffID}`
        .replace(
          `{${'countryCode'}}`,
          encodeURIComponent(String(requestParameters.countryCode)),
        )
        .replace(
          `{${'partyID'}}`,
          encodeURIComponent(String(requestParameters.partyID)),
        )
        .replace(
          `{${'tariffID'}}`,
          encodeURIComponent(String(requestParameters.tariffID)),
        ),
      method: 'GET',
      headers: headerParameters,
    });
  }

  async putTariff(
    requestParameters: PutTariffRequest,
    versionId: string = VersionNumber.TWO_DOT_TWO_DOT_ONE,
  ): Promise<OcpiResponse<void>> {
    this.validateRequiredParam(
      requestParameters,
      'countryCode',
      'partyID',
      'tariffID',
      'tariff',
    );

    const headerParameters: HTTPHeaders =
      getOcpiHeaders(requestParameters);

    setAuthHeader(headerParameters);
    return await this.request({
      path: `${this.getBasePath(versionId)}/tariffs/{countryCode}/{partyID}/{tariffID}`
        .replace(
          `{${'countryCode'}}`,
          encodeURIComponent(String(requestParameters.countryCode)),
        )
        .replace(
          `{${'partyID'}}`,
          encodeURIComponent(String(requestParameters.partyID)),
        )
        .replace(
          `{${'tariffID'}}`,
          encodeURIComponent(String(requestParameters.tariffID)),
        ),
      method: 'PUT',
      headers: headerParameters,
      body: requestParameters.tariff,
    });
  }
}
