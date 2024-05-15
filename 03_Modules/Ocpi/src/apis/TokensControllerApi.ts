import {
  OcpiParams,
  setAuthHeader,
  getOcpiHeaders,
} from './util';
import { BaseAPI, HTTPHeaders } from './BaseApi';
import { OcpiResponse } from '../util/ocpi.response';
import { Token } from '../model/Token';
import { TokenType } from '../model/TokenType';
import { VersionNumber } from '../model/VersionNumber';

export interface GetTokenRequest extends OcpiParams {
  countryCode: string;
  partyID: string;
  tokenUID: string;
  type?: TokenType;
}

export interface PatchTokenRequest extends OcpiParams {
  countryCode: string;
  partyID: string;
  tokenUID: string;
  requestBody: { [key: string]: object };
  type?: TokenType;
}

export interface PutTokenRequest extends OcpiParams {
  countryCode: string;
  partyID: string;
  tokenUID: string;
  token: Token;
  type?: TokenType;
}

export class TokensControllerApi extends BaseAPI {
  async getToken(
    requestParameters: GetTokenRequest,
    versionId: string = VersionNumber.TWO_DOT_TWO_DOT_ONE,
  ): Promise<OcpiResponse<Token>> {
    this.validateRequiredParam(
      requestParameters,
      'countryCode',
      'partyID',
      'tokenUID',
    );

    const queryParameters: any = {};

    if (requestParameters.type != null) {
      queryParameters['type'] = requestParameters.type;
    }

    const headerParameters: HTTPHeaders =
      getOcpiHeaders(requestParameters);

    setAuthHeader(headerParameters);
    return await this.request({
      path: `${this.getBasePath(versionId)}/tokens/{countryCode}/{partyID}/{tokenUID}`
        .replace(
          'countryCode',
          encodeURIComponent(String(requestParameters.countryCode)),
        )
        .replace(
          'partyID',
          encodeURIComponent(String(requestParameters.partyID)),
        )
        .replace(
          'tokenUID',
          encodeURIComponent(String(requestParameters.tokenUID)),
        ),
      method: 'GET',
      headers: headerParameters,
      query: queryParameters,
    });
  }

  async patchToken(
    requestParameters: PatchTokenRequest,
    versionId: string = VersionNumber.TWO_DOT_TWO_DOT_ONE,
  ): Promise<OcpiResponse<void>> {
    this.validateRequiredParam(
      requestParameters,
      'countryCode',
      'partyID',
      'tokenUID',
      'requestBody',
    );

    const queryParameters: any = {};

    if (requestParameters.type != null) {
      queryParameters['type'] = requestParameters.type;
    }

    const headerParameters: HTTPHeaders =
      getOcpiHeaders(requestParameters);

    setAuthHeader(headerParameters);
    return await this.request({
      path: `${this.getBasePath(versionId)}/tokens/{countryCode}/{partyID}/{tokenUID}`
        .replace(
          'countryCode',
          encodeURIComponent(String(requestParameters.countryCode)),
        )
        .replace(
          'partyID',
          encodeURIComponent(String(requestParameters.partyID)),
        )
        .replace(
          'tokenUID',
          encodeURIComponent(String(requestParameters.tokenUID)),
        ),
      method: 'PATCH',
      headers: headerParameters,
      query: queryParameters,
      body: requestParameters.requestBody,
    });
  }

  async putToken(
    requestParameters: PutTokenRequest,
    versionId: string = VersionNumber.TWO_DOT_TWO_DOT_ONE,
  ): Promise<OcpiResponse<void>> {
    this.validateRequiredParam(
      requestParameters,
      'countryCode',
      'partyID',
      'tokenUID',
      'token',
    );

    const queryParameters: any = {};

    if (requestParameters.type != null) {
      queryParameters['type'] = requestParameters.type;
    }

    const headerParameters: HTTPHeaders =
      getOcpiHeaders(requestParameters);

    setAuthHeader(headerParameters);
    return await this.request({
      path: `${this.getBasePath(versionId)}/tokens/{countryCode}/{partyID}/{tokenUID}`
        .replace(
          'countryCode',
          encodeURIComponent(String(requestParameters.countryCode)),
        )
        .replace(
          'partyID',
          encodeURIComponent(String(requestParameters.partyID)),
        )
        .replace(
          'tokenUID',
          encodeURIComponent(String(requestParameters.tokenUID)),
        ),
      method: 'PUT',
      headers: headerParameters,
      query: queryParameters,
      body: requestParameters.token,
    });
  }
}
