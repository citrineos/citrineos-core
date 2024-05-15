import {getOcpiHeaders, setAuthHeader,} from './util';
import {BaseAPI, HTTPHeaders, RequiredError} from './BaseApi';
import {Cdr} from '../model/Cdr';
import {OcpiResponse} from '../util/ocpi.response';
import {IsNotEmpty, IsString, ValidateNested} from "class-validator";
import {OcpiParams} from "./util/ocpi.params";
import {Type} from "class-transformer";


export class PostCdrParams extends OcpiParams {
  @IsNotEmpty()
  @Type(() => Cdr)
  @ValidateNested()
  cdr!: Cdr;
}

export class GetCdrParams extends OcpiParams {
  @IsNotEmpty()
  @IsString()
  url!: string;
}

export class CdrsControllerApi extends BaseAPI {

  CONTROLLER_PATH = 'cdrs';

  override getBasePath(params: OcpiParams) {
    return `${super.getBasePath(params)}/${this.CONTROLLER_PATH}`;
  }

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

    if (!params.cdr) {
      throw new RequiredError('cdr', this.getRequiredParametersErrorMsgString('cdr'));
    }

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
