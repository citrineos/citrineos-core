import {getOcpiHeaders, OcpiParams, setAuthHeader,} from './util';
import {BaseAPI, HTTPHeaders, OcpiModules} from './BaseApi';
import {OcpiResponse} from '../util/ocpi.response';
import {Tariff} from '../model/Tariff';
import {GetTariffParams} from "./params/tariff/get.tariff.params";
import {PutTariffParams} from "./params/tariff/put.tariff.params";
import {DeleteTariffParams} from "./params/tariff/delete.tariff.params";

export class TariffsControllerApi extends BaseAPI {

  CONTROLLER_PATH = OcpiModules.Tariffs;

  async getTariff(
    params: GetTariffParams
  ): Promise<OcpiResponse<Tariff>> {

    this.validateOcpiParams(params);

    this.validateRequiredParam(
      params,
      'countryCode',
      'partyId',
      'tariffId',
    );

    const headerParameters: HTTPHeaders =
      getOcpiHeaders(params);

    setAuthHeader(headerParameters);
    return await this.request({
      path: `${this.getBasePath(params)}/{countryCode}/{partyId}/{tariffId}`
        .replace(
          'countryCode',
          encodeURIComponent(String(params.countryCode)),
        )
        .replace(
          'partyId',
          encodeURIComponent(String(params.partyId)),
        )
        .replace(
          'tariffId',
          encodeURIComponent(String(params.tariffId)),
        ),
      method: 'GET',
      headers: headerParameters,
    });
  }

  async putTariff(
    params: PutTariffParams
  ): Promise<OcpiResponse<Tariff>> {

    this.validateOcpiParams(params);

    this.validateRequiredParam(
      params,
      'countryCode',
      'partyId',
      'tariffId',
      'tariff',
    );

    const headerParameters: HTTPHeaders =
      getOcpiHeaders(params);

    setAuthHeader(headerParameters);
    return await this.request({
      path: `${this.getBasePath(params)}/{countryCode}/{partyId}/{tariffId}`
        .replace(
          'countryCode',
          encodeURIComponent(String(params.countryCode)),
        )
        .replace(
          'partyId',
          encodeURIComponent(String(params.partyId)),
        )
        .replace(
          'tariffId',
          encodeURIComponent(String(params.tariffId)),
        ),
      method: 'PUT',
      headers: headerParameters,
      body: params.tariff,
    });
  }

  async deleteTariff(
    params: DeleteTariffParams,
  ): Promise<OcpiResponse<void>> {

    this.validateOcpiParams(params);

    this.validateRequiredParam(
      params,
      'countryCode',
      'partyId',
      'tariffId',
    );

    const headerParameters: HTTPHeaders =
      getOcpiHeaders(params);

    setAuthHeader(headerParameters);
    return await this.request({
      path: `${this.getBasePath(params)}/{countryCode}/{partyId}/{tariffId}`
        .replace(
          'countryCode',
          encodeURIComponent(String(params.countryCode)),
        )
        .replace(
          'partyId',
          encodeURIComponent(String(params.partyId)),
        )
        .replace(
          'tariffId',
          encodeURIComponent(String(params.tariffId)),
        ),
      method: 'DELETE',
      headers: headerParameters,
    });
  }
}
