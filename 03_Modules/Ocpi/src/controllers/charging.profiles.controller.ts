import {Body, Controller, Param, Post, Put} from 'routing-controllers';
import {BaseController} from './base.controller';
import {HttpStatus} from '@citrineos/base';
import {ActiveChargingProfileResult} from '../model/ActiveChargingProfileResult';
import {ActiveChargingProfile} from '../model/ActiveChargingProfile';
import {OcpiEmptyResponse} from '../util/ocpi.empty.response';
import {AsOcpiEndpoint} from '../util/decorators/as.ocpi.endpoint';
import {OcpiModules} from "../apis/BaseApi";
import {ClearChargingProfileResult} from "../model/ChargingprofilesClearProfileResult";
import {ChargingProfileResult} from "../model/ChargingProfileResponse";
import {ResponseSchema} from "../util/openapi";

@Controller(`/${OcpiModules.ChargingProfiles}`)
export class ChargingProfilesController extends BaseController {
  @Post('/:id')
  @AsOcpiEndpoint()
  @ResponseSchema(OcpiEmptyResponse, {
    statusCode: HttpStatus.OK,
    description: 'Successful response',
  })
  async postGenericChargingProfileResult(
    @Param('id') _id: string,
    @Body() _activeChargingProfileResult: ActiveChargingProfileResult | ChargingProfileResult | ClearChargingProfileResult
  ): Promise<OcpiEmptyResponse> {
    return this.generateMockOcpiResponse(OcpiEmptyResponse);
  }

  @Put('/:sessionId')
  @AsOcpiEndpoint()
  @ResponseSchema(OcpiEmptyResponse, {
    statusCode: HttpStatus.OK,
    description: 'Successful response',
  })
  async putSenderChargingProfile(
    @Param('sessionId') _sessionId: string,
    @Body() _activeChargingProfile: ActiveChargingProfile,
  ): Promise<OcpiEmptyResponse> {
    return this.generateMockOcpiResponse(OcpiEmptyResponse);
  }
}
