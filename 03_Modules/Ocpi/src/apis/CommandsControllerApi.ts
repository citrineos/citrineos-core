import {getOcpiHeaders, OcpiParams, setAuthHeader,} from './util';
import {BaseAPI, HTTPHeaders, OcpiModules} from './BaseApi';
import {CommandResponse} from '../model/CommandResponse';
import {OcpiResponse} from '../util/ocpi.response';
import {PostCommandParams} from "./params/commands/post.command.params";

export class CommandsControllerApi extends BaseAPI {

  CONTROLLER_PATH = OcpiModules.Commands;

  async postCommand(
    params: PostCommandParams
  ): Promise<OcpiResponse<CommandResponse>> {

    this.validateOcpiParams(params);

    this.validateRequiredParam(params, 'url', 'commandResult');

    const headerParameters: HTTPHeaders =
      getOcpiHeaders(params);

    setAuthHeader(headerParameters);
    return await this.request({
      path: params.url,
      method: 'POST',
      headers: headerParameters,
      body: params.commandResult,
    });
  }
}
