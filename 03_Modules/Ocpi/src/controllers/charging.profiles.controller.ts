import { Body, Controller, Params, Post, Put } from 'routing-controllers';
import { BaseController } from './base.controller';
import { HttpStatus } from '@citrineos/base';
import { ActiveChargingProfileResult } from '../model/ActiveChargingProfileResult';
import { UidVersionIdParam } from '../modules/temp/schema/uid.version.id.param.schema';
import { ActiveChargingProfile } from '../model/ActiveChargingProfile';
import { SessionIdVersionIdParam } from '../modules/temp/schema/session.id.version.id.param.schema';
import { ResponseSchema } from 'routing-controllers-openapi';
import { OcpiEmptyResponse } from '../util/ocpi.empty.response';
import { AsOcpiEndpoint } from '../util/decorators/as.ocpi.endpoint';

@Controller()
export class ChargingProfilesController extends BaseController {
  @Post('/ocpi/:versionId/sender/chargingprofiles/result/:uid')
  @AsOcpiEndpoint()
  @ResponseSchema(OcpiEmptyResponse, {
    statusCode: HttpStatus.OK,
    description: 'Successful response',
  })
  async postGenericChargingProfileResult(
    @Params() _uidVersionIdParam: UidVersionIdParam,
    @Body() _activeChargingProfileResult: ActiveChargingProfileResult,
  ): Promise<OcpiEmptyResponse> {
    return this.generateMockResponse(OcpiEmptyResponse);
  }

  @Put('/ocpi/:versionId/sender/chargingprofiles/:sessionId')
  @AsOcpiEndpoint()
  @ResponseSchema(OcpiEmptyResponse, {
    statusCode: HttpStatus.OK,
    description: 'Successful response',
  })
  async putSenderChargingProfile(
    @Params() _sessionIdVersionIdParam: SessionIdVersionIdParam,
    @Body() _activeChargingProfile: ActiveChargingProfile,
  ): Promise<OcpiEmptyResponse> {
    return this.generateMockResponse(OcpiEmptyResponse);
  }
}
