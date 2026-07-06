// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ICommandsModuleApi } from './ICommandsModuleApi.js';
import { Body, Ctx, JsonController, Param, Post } from 'routing-controllers';
import type { TenantPartnerDto } from '@citrineos/base';
import { HttpStatus, OCPPVersion } from '@citrineos/base';
import type {
  CancelReservation,
  OcpiCommandResponse,
  ReserveNow,
  StartSession,
  StopSession,
  UnlockConnector,
} from '../../../index.js';
import {
  AsAdminEndpoint,
  AsOcpiFunctionalEndpoint,
  BaseController,
  CancelReservationSchema,
  CancelReservationSchemaName,
  CommandExecutor,
  CommandResponseSchema,
  CommandResponseSchemaName,
  CommandsService,
  CommandType,
  EnumParam,
  generateMockForSchema,
  ModuleId,
  MultipleTypes,
  OpenAPI,
  ReserveNowSchema,
  ReserveNowSchemaName,
  ResponseGenerator,
  ResponseSchema,
  StartSessionSchema,
  StartSessionSchemaName,
  StopSessionSchema,
  StopSessionSchemaName,
  UnlockConnectorSchema,
  UnlockConnectorSchemaName,
  versionIdParam,
  VersionNumber,
  VersionNumberParam,
} from '../../../index.js';
import { ContentType } from '../../../util/ContentType.js';
import { Inject, Service } from 'typedi';

const MOCK_COMMAND_RESPONSE = await generateMockForSchema(
  CommandResponseSchema,
  CommandResponseSchemaName,
);

// The command body is a union of command-specific payloads (see @MultipleTypes
// below). Generate a concrete example per command type so Swagger UI can offer a
// realistic request body for each one rather than a single ambiguous schema.
const COMMAND_REQUEST_SCHEMAS: Record<CommandType, { schema: any; name: string }> = {
  [CommandType.CANCEL_RESERVATION]: {
    schema: CancelReservationSchema,
    name: CancelReservationSchemaName,
  },
  [CommandType.RESERVE_NOW]: {
    schema: ReserveNowSchema,
    name: ReserveNowSchemaName,
  },
  [CommandType.START_SESSION]: {
    schema: StartSessionSchema,
    name: StartSessionSchemaName,
  },
  [CommandType.STOP_SESSION]: {
    schema: StopSessionSchema,
    name: StopSessionSchemaName,
  },
  [CommandType.UNLOCK_CONNECTOR]: {
    schema: UnlockConnectorSchema,
    name: UnlockConnectorSchemaName,
  },
};

const COMMAND_REQUEST_EXAMPLES: Record<string, { summary: string; value: any }> = {};
for (const [commandType, { schema, name }] of Object.entries(COMMAND_REQUEST_SCHEMAS)) {
  const value = await generateMockForSchema(schema, name);
  if (value !== null && value !== undefined) {
    COMMAND_REQUEST_EXAMPLES[commandType] = { summary: commandType, value };
  }
}

@JsonController(`/:${versionIdParam}/${ModuleId.Commands}`)
@Service()
export class CommandsModuleApi extends BaseController implements ICommandsModuleApi {
  @Inject()
  private commandsExecutor!: CommandExecutor;

  constructor(readonly commandsService: CommandsService) {
    super();
  }

  @Post('/:commandType')
  @AsOcpiFunctionalEndpoint()
  @ResponseSchema(CommandResponseSchema, CommandResponseSchemaName, {
    statusCode: HttpStatus.OK,
    description: 'Successful response',
    examples: {
      success: MOCK_COMMAND_RESPONSE,
    },
  })
  @OpenAPI({
    requestBody: {
      content: {
        [ContentType.JSON]: {
          examples: COMMAND_REQUEST_EXAMPLES,
        },
      },
    },
  })
  async postCommand(
    @VersionNumberParam() _versionNumber: VersionNumber,
    @EnumParam('commandType', CommandType, 'CommandType')
    commandType: CommandType,
    @Body() // todo use new @Body from ocpi-base
    @MultipleTypes(
      { schema: CancelReservationSchema, name: CancelReservationSchemaName },
      { schema: ReserveNowSchema, name: ReserveNowSchemaName },
      { schema: StartSessionSchema, name: StartSessionSchemaName },
      { schema: StopSessionSchema, name: StopSessionSchemaName },
      { schema: UnlockConnectorSchema, name: UnlockConnectorSchemaName },
    )
    payload: CancelReservation | ReserveNow | StartSession | StopSession | UnlockConnector,
    @Ctx() ctx: any,
  ): Promise<OcpiCommandResponse> {
    this.logger.debug('postCommand', commandType, payload);
    let validationResult:
      | ReturnType<typeof CancelReservationSchema.safeParse>
      | ReturnType<typeof ReserveNowSchema.safeParse>
      | ReturnType<typeof StartSessionSchema.safeParse>
      | ReturnType<typeof StopSessionSchema.safeParse>
      | ReturnType<typeof UnlockConnectorSchema.safeParse>;
    switch (commandType) {
      case CommandType.CANCEL_RESERVATION:
        validationResult = CancelReservationSchema.safeParse(payload);
        break;
      case CommandType.RESERVE_NOW:
        validationResult = ReserveNowSchema.safeParse(payload);
        break;
      case CommandType.START_SESSION:
        validationResult = StartSessionSchema.safeParse(payload);
        break;
      case CommandType.STOP_SESSION:
        validationResult = StopSessionSchema.safeParse(payload);
        break;
      case CommandType.UNLOCK_CONNECTOR:
        validationResult = UnlockConnectorSchema.safeParse(payload);
        break;
      default:
        return ResponseGenerator.buildGenericClientErrorResponse(
          undefined,
          'Unknown command type: ' + commandType,
          undefined,
        ) as any;
    }

    if (!validationResult.success) {
      const errorString = validationResult.error.issues
        .map((error) => `${error.path.join('.')}: ${error.message}`)
        .join(', ');

      return ResponseGenerator.buildGenericClientErrorResponse(undefined, errorString) as any;
    }

    return await this.commandsService.postCommand(
      commandType,
      validationResult.data,
      ctx!.state!.tenantPartner as TenantPartnerDto,
    );
  }

  @Post('/callback/:tenantPartnerId/:ocppVersion/:command/:commandId')
  @AsAdminEndpoint()
  async postAsynchronousResponse(
    @Param('tenantPartnerId') tenantPartnerId: number,
    @Param('ocppVersion') ocppVersion: OCPPVersion,
    @Param('command') command: CommandType,
    @Param('commandId') commandId: string,
    @Body() response: any,
  ): Promise<void> {
    await this.commandsExecutor.handleAsyncCommandResponse(
      tenantPartnerId,
      ocppVersion,
      command,
      commandId,
      response,
    );
  }
}
