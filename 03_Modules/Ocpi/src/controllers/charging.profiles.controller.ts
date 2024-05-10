import {
  Body,
  Controller,
  HeaderParams,
  Params,
  Post,
  Put,
} from 'routing-controllers';
import { BaseController } from './base.controller';
import { HttpStatus } from '@citrineos/base';
import { ActiveChargingProfileResult } from '../model/ActiveChargingProfileResult';
import { UidVersionIdParam } from '../modules/temp/schema/uid.version.id.param.schema';
import { AuthorizationHeader } from '../modules/temp/schema/authorizationHeader';
import { ActiveChargingProfile } from '../model/ActiveChargingProfile';
import { SessionIdVersionIdParam } from '../modules/temp/schema/session.id.version.id.param.schema';
import { ResponseSchema } from 'routing-controllers-openapi';
import { OcpiEmptyResponse } from '../util/ocpi.empty.response';

@Controller()
export class ChargingProfilesController extends BaseController {
  @Post('/ocpi/:versionId/sender/chargingprofiles/result/:uid')
  @ResponseSchema(OcpiEmptyResponse, {
    statusCode: HttpStatus.OK,
    description: 'Successful response',
  })
  async postGenericChargingProfileResult(
    @HeaderParams() _authorizationHeader: AuthorizationHeader,
    @Params() _uidVersionIdParam: UidVersionIdParam,
    @Body() _activeChargingProfileResult: ActiveChargingProfileResult,
  ): Promise<OcpiEmptyResponse> {
    return this.generateMockResponse(OcpiEmptyResponse);
  }

  @Put('/ocpi/:versionId/sender/chargingprofiles/:sessionId')
  @ResponseSchema(OcpiEmptyResponse, {
    statusCode: HttpStatus.OK,
    description: 'Successful response',
  })
  async putSenderChargingProfile(
    @HeaderParams() _authorizationHeader: AuthorizationHeader,
    @Params() _sessionIdVersionIdParam: SessionIdVersionIdParam,
    @Body() _activeChargingProfile: ActiveChargingProfile,
  ): Promise<OcpiEmptyResponse> {
    return this.generateMockResponse(OcpiEmptyResponse);
  }
}
