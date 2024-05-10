import {
  BaseOcpiHeaders,
  setAuthHeader,
  validateAndgetOcpiHeaders,
} from './util';
import { BaseAPI, HTTPHeaders } from './BaseApi';
import { ChargingProfileResponse } from '../model/ChargingProfileResponse';
import { OcpiResponse } from '@citrineos/base';
import { VersionNumber } from '../model/VersionNumber';
import { SetChargingProfile } from '../model/SetChargingProfile';

export interface DeleteReceiverChargingProfileRequest extends BaseOcpiHeaders {
  sessionId: string;
  responseUrl: string;
}

export interface GetReceiverChargingProfileRequest extends BaseOcpiHeaders {
  sessionId: string;
  duration: number;
  responseUrl: string;
}

export interface PutReceiverChargingProfileRequest extends BaseOcpiHeaders {
  sessionId: string;
  setChargingProfile: SetChargingProfile;
}

export class ChargingProfilesControllerApi extends BaseAPI {
  async deleteReceiverChargingProfile(
    requestParameters: DeleteReceiverChargingProfileRequest,
    versionId: string = VersionNumber.TWO_DOT_TWO_DOT_ONE,
  ): Promise<OcpiResponse<void>> {
    BaseAPI.validateRequiredParam(
      requestParameters,
      'sessionId',
      'responseUrl',
    );

    const queryParameters: any = {};

    if (requestParameters.responseUrl != null) {
      queryParameters['response_url'] = requestParameters.responseUrl;
    }

    const headerParameters: HTTPHeaders =
      validateAndgetOcpiHeaders(requestParameters);

    setAuthHeader(headerParameters);
    return await this.request({
      path: `/ocpi/${versionId}/receiver/chargingprofiles/{sessionId}`.replace(
        `{${'sessionId'}}`,
        encodeURIComponent(String(requestParameters.sessionId)),
      ),
      method: 'DELETE',
      headers: headerParameters,
      query: queryParameters,
    });
  }

  async getReceiverChargingProfile(
    requestParameters: GetReceiverChargingProfileRequest,
    versionId: string = VersionNumber.TWO_DOT_TWO_DOT_ONE,
  ): Promise<OcpiResponse<ChargingProfileResponse>> {
    BaseAPI.validateRequiredParam(
      requestParameters,
      'sessionId',
      'duration',
      'responseUrl',
    );

    const queryParameters: any = {};

    if (requestParameters.duration != null) {
      queryParameters['duration'] = requestParameters.duration;
    }

    if (requestParameters.responseUrl != null) {
      queryParameters['response_url'] = requestParameters.responseUrl;
    }

    const headerParameters: HTTPHeaders =
      validateAndgetOcpiHeaders(requestParameters);

    setAuthHeader(headerParameters);
    return await this.request({
      path: `/ocpi/${versionId}/receiver/chargingprofiles/{sessionId}`.replace(
        `{${'sessionId'}}`,
        encodeURIComponent(String(requestParameters.sessionId)),
      ),
      method: 'GET',
      headers: headerParameters,
      query: queryParameters,
    });
  }

  async putReceiverChargingProfile(
    requestParameters: PutReceiverChargingProfileRequest,
    versionId: string = VersionNumber.TWO_DOT_TWO_DOT_ONE,
  ): Promise<OcpiResponse<void>> {
    BaseAPI.validateRequiredParam(
      requestParameters,
      'sessionId',
      'setChargingProfile',
    );

    const headerParameters: HTTPHeaders =
      validateAndgetOcpiHeaders(requestParameters);

    setAuthHeader(headerParameters);
    return await this.request({
      path: `/ocpi/${versionId}/receiver/chargingprofiles/{sessionId}`.replace(
        `{${'sessionId'}}`,
        encodeURIComponent(String(requestParameters.sessionId)),
      ),
      method: 'PUT',
      headers: headerParameters,
      body: requestParameters.setChargingProfile,
    });
  }
}
