import {
  OcpiParams,
  setAuthHeader,
  getOcpiHeaders,
} from './util';
import { BaseAPI, HTTPHeaders } from './BaseApi';
import { OcpiResponse } from '../util/ocpi.response';
import { Session } from '../model/Session';
import { VersionNumber } from '../model/VersionNumber';

export interface GetSessionRequest extends OcpiParams {
  countryCode: string;
  partyID: string;
  sessionID: string;
}

export interface PatchSessionRequest extends OcpiParams {
  countryCode: string;
  partyID: string;
  sessionID: string;
  requestBody: { [key: string]: object };
}

export interface PutSessionRequest extends OcpiParams {
  countryCode: string;
  partyID: string;
  sessionID: string;
  session: Session;
}

export class SessionsControllerApi extends BaseAPI {
  async getSession(
    requestParameters: GetSessionRequest,
    versionId: string = VersionNumber.TWO_DOT_TWO_DOT_ONE,
  ): Promise<OcpiResponse<Session>> {
    this.validateRequiredParam(
      requestParameters,
      'countryCode',
      'partyID',
      'sessionID',
    );

    const headerParameters: HTTPHeaders =
      getOcpiHeaders(requestParameters);

    setAuthHeader(headerParameters);
    return await this.request({
      path: `${this.getBasePath(versionId)}/sessions/{countryCode}/{partyID}/{sessionID}`
        .replace(
          'countryCode',
          encodeURIComponent(String(requestParameters.countryCode)),
        )
        .replace(
          'partyID',
          encodeURIComponent(String(requestParameters.partyID)),
        )
        .replace(
          'sessionID',
          encodeURIComponent(String(requestParameters.sessionID)),
        ),
      method: 'GET',
      headers: headerParameters,
    });
  }

  async patchSession(
    requestParameters: PatchSessionRequest,
    versionId: string = VersionNumber.TWO_DOT_TWO_DOT_ONE,
  ): Promise<OcpiResponse<void>> {
    this.validateRequiredParam(
      requestParameters,
      'countryCode',
      'partyID',
      'sessionID',
      'requestBody',
    );

    const headerParameters: HTTPHeaders =
      getOcpiHeaders(requestParameters);

    setAuthHeader(headerParameters);
    return await this.request({
      path: `${this.getBasePath(versionId)}/sessions/{countryCode}/{partyID}/{sessionID}`
        .replace(
          'countryCode',
          encodeURIComponent(String(requestParameters.countryCode)),
        )
        .replace(
          'partyID',
          encodeURIComponent(String(requestParameters.partyID)),
        )
        .replace(
          'sessionID',
          encodeURIComponent(String(requestParameters.sessionID)),
        ),
      method: 'PATCH',
      headers: headerParameters,
      body: requestParameters.requestBody,
    });
  }

  async putSession(
    requestParameters: PutSessionRequest,
    versionId: string = VersionNumber.TWO_DOT_TWO_DOT_ONE,
  ): Promise<OcpiResponse<void>> {
    this.validateRequiredParam(
      requestParameters,
      'countryCode',
      'partyID',
      'sessionID',
      'session',
    );

    const headerParameters: HTTPHeaders =
      getOcpiHeaders(requestParameters);

    setAuthHeader(headerParameters);
    return await this.request({
      path: `${this.getBasePath(versionId)}/sessions/{countryCode}/{partyID}/{sessionID}`
        .replace(
          'countryCode',
          encodeURIComponent(String(requestParameters.countryCode)),
        )
        .replace(
          'partyID',
          encodeURIComponent(String(requestParameters.partyID)),
        )
        .replace(
          'sessionID',
          encodeURIComponent(String(requestParameters.sessionID)),
        ),
      method: 'PUT',
      headers: headerParameters,
      body: requestParameters.session,
    });
  }
}
