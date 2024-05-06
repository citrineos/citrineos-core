import { BaseAPI, HTTPHeaders } from './BaseApi';
import { setAuthHeader } from './util';
import { OcpiResponse, VersionDetailsDTO, VersionDTO } from '@citrineos/base';

export interface GetVersionRequest {
  authorization: string;
  versionId: string;
}

export interface GetVersionsRequest {
  authorization: string;
}

export class VersionsControllerApi extends BaseAPI {
  async getVersion(
    requestParameters: GetVersionRequest,
  ): Promise<OcpiResponse<VersionDetailsDTO>> {
    BaseAPI.validateRequiredParam(requestParameters, 'authorization');

    const headerParameters: HTTPHeaders = {};

    if (requestParameters.authorization != null) {
      headerParameters['Authorization'] = String(
        requestParameters.authorization,
      );
    }

    setAuthHeader(headerParameters);
    return await this.request({
      path: `/ocpi/${requestParameters.versionId}`,
      method: 'GET',
      headers: headerParameters,
    });
  }

  /**
   * This endpoint lists all the available OCPI versions and the corresponding URLs to where version specific details such as the supported endpoints can be found.
   */
  async getVersions(
    requestParameters: GetVersionsRequest,
  ): Promise<OcpiResponse<VersionDTO[]>> {
    BaseAPI.validateRequiredParam(requestParameters, 'authorization');

    const headerParameters: HTTPHeaders = {};

    if (requestParameters.authorization != null) {
      headerParameters['Authorization'] = String(
        requestParameters.authorization,
      );
    }

    setAuthHeader(headerParameters);
    return await this.request({
      path: '/ocpi/versions',
      method: 'GET',
      headers: headerParameters,
    });
  }
}
