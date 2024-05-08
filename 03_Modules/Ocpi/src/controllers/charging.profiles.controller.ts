import {Body, Controller, HeaderParams, Params, Post, Put} from "routing-controllers";
import {BaseController} from "./base.controller";
import {HttpStatus, OcpiResponse} from "@citrineos/base";
import {ActiveChargingProfileResult} from "../model/ActiveChargingProfileResult";
import {UidVersionIdParam} from "../modules/temp/schema/uid.version.id.param.schema";
import {AuthorizationHeader} from "../modules/temp/schema/authorizationHeader";
import {ActiveChargingProfile} from "../model/ActiveChargingProfile";
import {SessionIdVersionIdParam} from "../modules/temp/schema/session.id.version.id.param.schema";
import {ResponseSchema} from "routing-controllers-openapi";

@Controller()
export class ChargingProfilesController extends BaseController {

  @Post('/ocpi/:versionId/sender/chargingprofiles/result/:uid')
  @ResponseSchema(OcpiResponse<void>, {statusCode: HttpStatus.OK, description: 'Successful response'})
  async postGenericChargingProfileResult(
    @HeaderParams() authorizationHeader: AuthorizationHeader,
    @Params() uidVersionIdParam: UidVersionIdParam,
    @Body() activeChargingProfileResult: ActiveChargingProfileResult,
  ): Promise<OcpiResponse<void>> {
    return this.generateMockResponse(OcpiResponse<void>);
  }

  @Put('/ocpi/:versionId/sender/chargingprofiles/:sessionId')
  @ResponseSchema(OcpiResponse<void>, {statusCode: HttpStatus.OK, description: 'Successful response'})
  async putSenderChargingProfile(
    @HeaderParams() authorizationHeader: AuthorizationHeader,
    @Params() sessionIdVersionIdParam: SessionIdVersionIdParam,
    @Body() activeChargingProfile: ActiveChargingProfile,
  ): Promise<OcpiResponse<void>> {
    return this.generateMockResponse(OcpiResponse<void>);
  }

}
