import {getOcpiHeaders, OcpiParams, setAuthHeader,} from './util';
import {BaseAPI, HTTPHeaders, OcpiModules} from './BaseApi';
import {ChargingProfileResponse} from '../model/ChargingProfileResponse';
import {OcpiResponse} from '../util/ocpi.response';
import {DeleteChargingProfileParams} from "./params/charging.profile/delete.charging.profile.params";
import {GetChargingProfileParams} from "./params/charging.profile/get.charging.profile.params";
import {PutChargingProfileParams} from "./params/charging.profile/put.charging.profile.params";

export class ChargingProfilesControllerApi extends BaseAPI {

  CONTROLLER_PATH = OcpiModules.ChargingProfiles;

  async deleteChargingProfile(
    params: DeleteChargingProfileParams
  ): Promise<OcpiResponse<ChargingProfileResponse>> {

    this.validateOcpiParams(params);

    this.validateRequiredParam(
      params,
      'sessionId',
      'responseUrl',
    );

    const queryParameters: any = {};

    if (params.responseUrl != null) {
      queryParameters['response_url'] = params.responseUrl;
    }

    const headerParameters: HTTPHeaders =
      getOcpiHeaders(params);

    setAuthHeader(headerParameters);
    return await this.request({
      path: '/chargingprofiles/{sessionId}'.replace(
        'sessionId',
        encodeURIComponent(String(params.sessionId)),
      ),
      method: 'DELETE',
      headers: headerParameters,
      query: queryParameters,
    });
  }

  async getChargingProfile(
    params: GetChargingProfileParams
  ): Promise<OcpiResponse<ChargingProfileResponse>> {

    this.validateOcpiParams(params);

    this.validateRequiredParam(
      params,
      'sessionId',
      'duration',
      'responseUrl',
    );

    const queryParameters: any = {};

    if (params.duration != null) {
      queryParameters['duration'] = params.duration;
    }

    if (params.responseUrl != null) {
      queryParameters['response_url'] = params.responseUrl;
    }

    const headerParameters: HTTPHeaders =
      getOcpiHeaders(params);

    setAuthHeader(headerParameters);
    return await this.request({
      path: '/chargingprofiles/{sessionId}'.replace(
        'sessionId',
        encodeURIComponent(String(params.sessionId)),
      ),
      method: 'GET',
      headers: headerParameters,
      query: queryParameters,
    });
  }

  async putChargingProfile(
    params: PutChargingProfileParams
  ): Promise<OcpiResponse<ChargingProfileResponse>> {

    this.validateOcpiParams(params);

    this.validateRequiredParam(
      params,
      'sessionId',
      'setChargingProfile',
    );

    const headerParameters: HTTPHeaders =
      getOcpiHeaders(params);

    setAuthHeader(headerParameters);
    return await this.request({
      path: '/chargingprofiles/{sessionId}'.replace(
        'sessionId',
        encodeURIComponent(String(params.sessionId)),
      ),
      method: 'PUT',
      headers: headerParameters,
      body: params.setChargingProfile,
    });
  }
}
