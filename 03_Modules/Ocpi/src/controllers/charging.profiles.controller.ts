import {Body, Controller, Param, Post, Put} from 'routing-controllers';
import {BaseController} from './base.controller';
import {HttpStatus, VersionNumber} from '@citrineos/base';
import {ActiveChargingProfileResult} from '../model/ActiveChargingProfileResult';
import {ActiveChargingProfile} from '../model/ActiveChargingProfile';
import {ResponseSchema} from 'routing-controllers-openapi';
import {OcpiEmptyResponse} from '../util/ocpi.empty.response';
import {AsOcpiEndpoint} from '../util/decorators/as.ocpi.endpoint';
import {VersionNumberParam} from "../util/decorators/version.number.param";

@Controller()
export class ChargingProfilesController extends BaseController {
  @Post('/ocpi/:versionId/sender/chargingprofiles/result/:uid')
  @AsOcpiEndpoint()
  @ResponseSchema(OcpiEmptyResponse, {
    statusCode: HttpStatus.OK,
    description: 'Successful response',
  })
  async postGenericChargingProfileResult(
    @VersionNumberParam() _versionId: VersionNumber,
    @Param('uid') _uid: string,
    @Body() _activeChargingProfileResult: ActiveChargingProfileResult,
  ): Promise<OcpiEmptyResponse> {
    return this.generateMockOcpiResponse(OcpiEmptyResponse);
  }

  @Put('/ocpi/:versionId/sender/chargingprofiles/:sessionId')
  @AsOcpiEndpoint()
  @ResponseSchema(OcpiEmptyResponse, {
    statusCode: HttpStatus.OK,
    description: 'Successful response',
  })
  async putSenderChargingProfile(
    @VersionNumberParam() _versionId: VersionNumber,
    @Param('sessionId') _sessionId: string,
    @Body() _activeChargingProfile: ActiveChargingProfile,
  ): Promise<OcpiEmptyResponse> {
    return this.generateMockOcpiResponse(OcpiEmptyResponse);
  }
}
