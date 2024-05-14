import {
  BaseOcpiHeaders,
  setAuthHeader,
  validateAndgetOcpiHeaders,
} from './util';
import { BaseAPI, HTTPHeaders } from './BaseApi';
import { Connector } from '../model/Connector';
import { Evse } from '../model/Evse';
import { Location } from '../model/Location';
import { VersionNumber } from '../model/VersionNumber';
import { OcpiResponse } from '../util/ocpi.response';

export interface GetConnectorRequest extends BaseOcpiHeaders {
  countryCode: string;
  partyID: string;
  locationID: string;
  evseUID: string;
  connectorID: string;
}

export interface GetEvseRequest extends BaseOcpiHeaders {
  countryCode: string;
  partyID: string;
  locationID: string;
  evseUID: string;
}

export interface GetLocationRequest extends BaseOcpiHeaders {
  countryCode: string;
  partyID: string;
  locationID: string;
}

export interface PatchConnectorRequest extends BaseOcpiHeaders {
  countryCode: string;
  partyID: string;
  locationID: string;
  evseUID: string;
  connectorID: string;
  requestBody: { [key: string]: object };
}

export interface PatchEvseRequest extends BaseOcpiHeaders {
  countryCode: string;
  partyID: string;
  locationID: string;
  evseUID: string;
  requestBody: { [key: string]: object };
}

export interface PatchLocationRequest extends BaseOcpiHeaders {
  countryCode: string;
  partyID: string;
  locationID: string;
  requestBody: { [key: string]: object };
}

export interface PutConnectorRequest extends BaseOcpiHeaders {
  countryCode: string;
  partyID: string;
  locationID: string;
  evseUID: string;
  connectorID: string;
  connector: Connector;
}

export interface PutEvseRequest extends BaseOcpiHeaders {
  countryCode: string;
  partyID: string;
  locationID: string;
  evseUID: string;
  evse: Evse;
}

export interface PutLocationRequest extends BaseOcpiHeaders {
  countryCode: string;
  partyID: string;
  locationID: string;
  location: Location;
}

export class LocationsControllerApi extends BaseAPI {
  async getConnector(
    requestParameters: GetConnectorRequest,
    versionId: string = VersionNumber.TWO_DOT_TWO_DOT_ONE,
  ): Promise<OcpiResponse<Connector>> {
    BaseAPI.validateRequiredParam(
      requestParameters,
      'countryCode',
      'partyID',
      'locationID',
      'evseUID',
      'connectorID',
    );

    const headerParameters: HTTPHeaders =
      validateAndgetOcpiHeaders(requestParameters);

    setAuthHeader(headerParameters);
    return await this.request({
      path: `/ocpi/receiver/${versionId}/locations/{countryCode}/{partyID}/{locationID}/{evseUID}/{connectorID}`
        .replace(
          `{${'countryCode'}}`,
          encodeURIComponent(String(requestParameters.countryCode)),
        )
        .replace(
          `{${'partyID'}}`,
          encodeURIComponent(String(requestParameters.partyID)),
        )
        .replace(
          `{${'locationID'}}`,
          encodeURIComponent(String(requestParameters.locationID)),
        )
        .replace(
          `{${'evseUID'}}`,
          encodeURIComponent(String(requestParameters.evseUID)),
        )
        .replace(
          `{${'connectorID'}}`,
          encodeURIComponent(String(requestParameters.connectorID)),
        ),
      method: 'GET',
      headers: headerParameters,
    });
  }

  async getEvse(
    requestParameters: GetEvseRequest,
    versionId: string = VersionNumber.TWO_DOT_TWO_DOT_ONE,
  ): Promise<OcpiResponse<Evse>> {
    BaseAPI.validateRequiredParam(
      requestParameters,
      'countryCode',
      'partyID',
      'locationID',
      'evseUID',
    );

    const headerParameters: HTTPHeaders =
      validateAndgetOcpiHeaders(requestParameters);

    setAuthHeader(headerParameters);
    return await this.request({
      path: `/ocpi/receiver/${versionId}/locations/{countryCode}/{partyID}/{locationID}/{evseUID}`
        .replace(
          `{${'countryCode'}}`,
          encodeURIComponent(String(requestParameters.countryCode)),
        )
        .replace(
          `{${'partyID'}}`,
          encodeURIComponent(String(requestParameters.partyID)),
        )
        .replace(
          `{${'locationID'}}`,
          encodeURIComponent(String(requestParameters.locationID)),
        )
        .replace(
          `{${'evseUID'}}`,
          encodeURIComponent(String(requestParameters.evseUID)),
        ),
      method: 'GET',
      headers: headerParameters,
    });
  }

  async getLocation(
    requestParameters: GetLocationRequest,
    versionId: string = VersionNumber.TWO_DOT_TWO_DOT_ONE,
  ): Promise<OcpiResponse<Location>> {
    BaseAPI.validateRequiredParam(
      requestParameters,
      'countryCode',
      'partyID',
      'locationID',
    );

    const headerParameters: HTTPHeaders =
      validateAndgetOcpiHeaders(requestParameters);

    setAuthHeader(headerParameters);
    return await this.request({
      path: `/ocpi/receiver/${versionId}/locations/{countryCode}/{partyID}/{locationID}`
        .replace(
          `{${'countryCode'}}`,
          encodeURIComponent(String(requestParameters.countryCode)),
        )
        .replace(
          `{${'partyID'}}`,
          encodeURIComponent(String(requestParameters.partyID)),
        )
        .replace(
          `{${'locationID'}}`,
          encodeURIComponent(String(requestParameters.locationID)),
        ),
      method: 'GET',
      headers: headerParameters,
    });
  }

  async patchConnector(
    requestParameters: PatchConnectorRequest,
    versionId: string = VersionNumber.TWO_DOT_TWO_DOT_ONE,
  ): Promise<OcpiResponse<void>> {
    BaseAPI.validateRequiredParam(
      requestParameters,
      'countryCode',
      'partyID',
      'locationID',
      'evseUID',
      'connectorID',
      'requestBody',
    );

    const headerParameters: HTTPHeaders =
      validateAndgetOcpiHeaders(requestParameters);

    setAuthHeader(headerParameters);
    return await this.request({
      path: `/ocpi/receiver/${versionId}/locations/{countryCode}/{partyID}/{locationID}/{evseUID}/{connectorID}`
        .replace(
          `{${'countryCode'}}`,
          encodeURIComponent(String(requestParameters.countryCode)),
        )
        .replace(
          `{${'partyID'}}`,
          encodeURIComponent(String(requestParameters.partyID)),
        )
        .replace(
          `{${'locationID'}}`,
          encodeURIComponent(String(requestParameters.locationID)),
        )
        .replace(
          `{${'evseUID'}}`,
          encodeURIComponent(String(requestParameters.evseUID)),
        )
        .replace(
          `{${'connectorID'}}`,
          encodeURIComponent(String(requestParameters.connectorID)),
        ),
      method: 'PATCH',
      headers: headerParameters,
      body: requestParameters.requestBody,
    });
  }

  async patchEvse(
    requestParameters: PatchEvseRequest,
    versionId: string = VersionNumber.TWO_DOT_TWO_DOT_ONE,
  ): Promise<OcpiResponse<void>> {
    BaseAPI.validateRequiredParam(
      requestParameters,
      'countryCode',
      'partyID',
      'locationID',
      'evseUID',
      'requestBody',
    );

    const headerParameters: HTTPHeaders =
      validateAndgetOcpiHeaders(requestParameters);

    setAuthHeader(headerParameters);
    return await this.request({
      path: `/ocpi/receiver/${versionId}/locations/{countryCode}/{partyID}/{locationID}/{evseUID}`
        .replace(
          `{${'countryCode'}}`,
          encodeURIComponent(String(requestParameters.countryCode)),
        )
        .replace(
          `{${'partyID'}}`,
          encodeURIComponent(String(requestParameters.partyID)),
        )
        .replace(
          `{${'locationID'}}`,
          encodeURIComponent(String(requestParameters.locationID)),
        )
        .replace(
          `{${'evseUID'}}`,
          encodeURIComponent(String(requestParameters.evseUID)),
        ),
      method: 'PATCH',
      headers: headerParameters,
      body: requestParameters.requestBody,
    });
  }

  async patchLocation(
    requestParameters: PatchLocationRequest,
    versionId: string = VersionNumber.TWO_DOT_TWO_DOT_ONE,
  ): Promise<OcpiResponse<void>> {
    BaseAPI.validateRequiredParam(
      requestParameters,
      'countryCode',
      'partyID',
      'locationID',
      'requestBody',
    );

    const headerParameters: HTTPHeaders =
      validateAndgetOcpiHeaders(requestParameters);

    setAuthHeader(headerParameters);
    return await this.request({
      path: `/ocpi/receiver/${versionId}/locations/{countryCode}/{partyID}/{locationID}`
        .replace(
          `{${'countryCode'}}`,
          encodeURIComponent(String(requestParameters.countryCode)),
        )
        .replace(
          `{${'partyID'}}`,
          encodeURIComponent(String(requestParameters.partyID)),
        )
        .replace(
          `{${'locationID'}}`,
          encodeURIComponent(String(requestParameters.locationID)),
        ),
      method: 'PATCH',
      headers: headerParameters,
      body: requestParameters.requestBody,
    });
  }

  async putConnector(
    requestParameters: PutConnectorRequest,
    versionId: string = VersionNumber.TWO_DOT_TWO_DOT_ONE,
  ): Promise<OcpiResponse<void>> {
    BaseAPI.validateRequiredParam(
      requestParameters,
      'countryCode',
      'partyID',
      'locationID',
      'evseUID',
      'connectorID',
      'connector',
    );

    const headerParameters: HTTPHeaders =
      validateAndgetOcpiHeaders(requestParameters);

    setAuthHeader(headerParameters);
    return await this.request({
      path: `/ocpi/receiver/${versionId}/locations/{countryCode}/{partyID}/{locationID}/{evseUID}/{connectorID}`
        .replace(
          `{${'countryCode'}}`,
          encodeURIComponent(String(requestParameters.countryCode)),
        )
        .replace(
          `{${'partyID'}}`,
          encodeURIComponent(String(requestParameters.partyID)),
        )
        .replace(
          `{${'locationID'}}`,
          encodeURIComponent(String(requestParameters.locationID)),
        )
        .replace(
          `{${'evseUID'}}`,
          encodeURIComponent(String(requestParameters.evseUID)),
        )
        .replace(
          `{${'connectorID'}}`,
          encodeURIComponent(String(requestParameters.connectorID)),
        ),
      method: 'PUT',
      headers: headerParameters,
      body: requestParameters.connector,
    });
  }

  async putEvse(
    requestParameters: PutEvseRequest,
    versionId: string = VersionNumber.TWO_DOT_TWO_DOT_ONE,
  ): Promise<OcpiResponse<void>> {
    BaseAPI.validateRequiredParam(
      requestParameters,
      'countryCode',
      'partyID',
      'locationID',
      'evseUID',
      'evse',
    );

    const headerParameters: HTTPHeaders =
      validateAndgetOcpiHeaders(requestParameters);

    setAuthHeader(headerParameters);
    return await this.request({
      path: `/ocpi/receiver/${versionId}/locations/{countryCode}/{partyID}/{locationID}/{evseUID}`
        .replace(
          `{${'countryCode'}}`,
          encodeURIComponent(String(requestParameters.countryCode)),
        )
        .replace(
          `{${'partyID'}}`,
          encodeURIComponent(String(requestParameters.partyID)),
        )
        .replace(
          `{${'locationID'}}`,
          encodeURIComponent(String(requestParameters.locationID)),
        )
        .replace(
          `{${'evseUID'}}`,
          encodeURIComponent(String(requestParameters.evseUID)),
        ),
      method: 'PUT',
      headers: headerParameters,
      body: requestParameters.evse,
    });
  }

  async putLocation(
    requestParameters: PutLocationRequest,
    versionId: string = VersionNumber.TWO_DOT_TWO_DOT_ONE,
  ): Promise<OcpiResponse<void>> {
    BaseAPI.validateRequiredParam(
      requestParameters,
      'countryCode',
      'partyID',
      'locationID',
      'location',
    );

    const headerParameters: HTTPHeaders =
      validateAndgetOcpiHeaders(requestParameters);

    setAuthHeader(headerParameters);
    return await this.request({
      path: `/ocpi/receiver/${versionId}/locations/{countryCode}/{partyID}/{locationID}`
        .replace(
          `{${'countryCode'}}`,
          encodeURIComponent(String(requestParameters.countryCode)),
        )
        .replace(
          `{${'partyID'}}`,
          encodeURIComponent(String(requestParameters.partyID)),
        )
        .replace(
          `{${'locationID'}}`,
          encodeURIComponent(String(requestParameters.locationID)),
        ),
      method: 'PUT',
      headers: headerParameters,
      body: requestParameters.location,
    });
  }
}
