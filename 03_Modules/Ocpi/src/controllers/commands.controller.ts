import {Body, Controller, Param, Post} from 'routing-controllers';
import {HttpStatus} from '@citrineos/base';
import {BaseController} from './base.controller';
import {ResponseSchema} from 'routing-controllers-openapi';
import {AsOcpiEndpoint} from '../util/decorators/as.ocpi.endpoint';
import {OcpiModules} from "../apis/BaseApi";
import {CommandType} from "../model/CommandType";
import {CancelReservation} from "../model/CancelReservation";
import {ReserveNow} from "../model/ReserveNow";
import {StartSession} from "../model/StartSession";
import {StopSession} from "../model/StopSession";
import {UnlockConnector} from "../model/UnlockConnector";
import {OcpiCommandResponse} from "../model/CommandResponse";

@Controller(`/${OcpiModules.Commands}`)
export class CommandsController extends BaseController {

  @Post('/:commandType')
  @AsOcpiEndpoint()
  @ResponseSchema(OcpiCommandResponse, {
    statusCode: HttpStatus.OK,
    description: 'Successful response',
  })
  async postCommand(
    @Param('commandType') _commandType: CommandType,
    @Body() _payload: CancelReservation | ReserveNow | StartSession | StopSession | UnlockConnector
  ): Promise<OcpiCommandResponse> {
    console.log('postCommand', _commandType, _payload);
    return this.generateMockOcpiResponse(OcpiCommandResponse);
  }
}
