import {Body, Controller, Param, Post, Put} from 'routing-controllers';
import {BaseController} from './base.controller';
import {HttpStatus} from '@citrineos/base';
import {ActiveChargingProfileResult} from '../model/ActiveChargingProfileResult';
import {ActiveChargingProfile} from '../model/ActiveChargingProfile';
import {ResponseSchema} from 'routing-controllers-openapi';
import {OcpiEmptyResponse} from '../util/ocpi.empty.response';
import {AsOcpiEndpoint} from '../util/decorators/as.ocpi.endpoint';
import {OcpiModules} from "../apis/BaseApi";
import {ChargingProfileResponse} from "../model/ChargingProfileResponse";
import {ClearChargingProfileResult} from "../model/ChargingprofilesClearProfileResult";

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
    @Body() _activeChargingProfileResult: ActiveChargingProfileResult | ChargingProfileResponse | ClearChargingProfileResult
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
