import {getOcpiHeaders, setAuthHeader,} from './util';
import {BaseAPI, HTTPHeaders, OcpiModules} from './BaseApi';
import {Cdr} from '../model/Cdr';
import {OcpiResponse} from '../util/ocpi.response';
import {GetCdrParams} from "./params/cdr/get.cdr.params";
import {PostCdrParams} from "./params/cdr/post.cdr.params";

export class CdrsControllerApi extends BaseAPI {

  CONTROLLER_PATH = OcpiModules.Cdrs;

  async getCdr(
    params: GetCdrParams
  ): Promise<OcpiResponse<Cdr>> {

    this.validateOcpiParams(params);

    const headerParameters: HTTPHeaders =
      getOcpiHeaders(params);

    setAuthHeader(headerParameters);
    return await this.request({
      path: this.getBasePath(params),
      method: 'GET',
      headers: headerParameters,
    });
  }

  async postCdr(
    params: PostCdrParams,
  ): Promise<string> {

    this.validateOcpiParams(params);

    this.validateRequiredParam(params, 'cdr');

    const headerParameters: HTTPHeaders =
      getOcpiHeaders(params);

    setAuthHeader(headerParameters);
    const response = await this.baseRequest({
      path: this.getBasePath(params),
      method: 'POST',
      headers: headerParameters,
      body: params.cdr,
    });

    const cdrLocationUrl = response.headers.get('Location');

    if (!cdrLocationUrl) {
      throw new Error('No Location header in OCPI response');
    }

    return cdrLocationUrl;
  }
}
