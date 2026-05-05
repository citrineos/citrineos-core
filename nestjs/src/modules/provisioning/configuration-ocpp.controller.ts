// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Body, Controller, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OCPP_CallAction } from '@ocpp/call-action';
import { ChangeAvailabilityRequest } from '@dto/configuration/change-availability.request';
import { ChangeAvailability16Request } from '@dto/configuration/change-availability-16.request';
import { ClearDisplayMessageRequest } from '@dto/configuration/clear-display-message.request';
import { CsmsDataTransferRequest } from '@dto/configuration/data-transfer.request';
import { GetDisplayMessagesRequest } from '@dto/configuration/get-display-messages.request';
import { PublishFirmwareRequest } from '@dto/configuration/publish-firmware.request';
import { ResetRequest } from '@dto/configuration/reset.request';
import { SetDisplayMessageRequest } from '@dto/configuration/set-display-message.request';
import { SetNetworkProfileRequest } from '@dto/configuration/set-network-profile.request';
import { TriggerMessageRequest } from '@dto/configuration/trigger-message.request';
import { TriggerMessage16Request } from '@dto/configuration/trigger-message-16.request';
import { UnpublishFirmwareRequest } from '@dto/configuration/unpublish-firmware.request';
import { UpdateFirmwareRequest } from '@dto/configuration/update-firmware.request';
import { UpdateFirmware16Request } from '@dto/configuration/update-firmware-16.request';
import { ChangeConfiguration16Request } from '@dto/configuration/change-configuration-16.request';
import { GetConfiguration16Request } from '@dto/configuration/get-configuration-16.request';
import { MessageConfirmation } from '@remote-calls/message-confirmation.dto';
import { RemoteCallDispatcher } from '@remote-calls/remote-call.dispatcher';
import { ModuleSegment, OCPPVersionSegment, ocppRoute } from '@ocpp/route-segments';

const dto = (body: object): Record<string, unknown> => ({ ...body });

/**
 * CSMS-initiated REST endpoints under the legacy `Configuration` tag.
 *
 * Mirrors `Server/src/Configuration/module.ts` route registrations:
 *   POST /ocpp/{version}/configuration/{action}
 *
 * Each endpoint accepts the OCPP request payload as the body, fans out
 * to one or more chargers (the `identifier` query parameter accepts
 * a single stationId or an array), and returns one
 * `MessageConfirmation` per identifier.
 *
 * Body schemas are accepted as raw `Record<string, unknown>` here — the
 * charger ultimately validates them. DTO codegen from `base/src/ocpp/model`
 * is tracked separately in the parity roadmap.
 */
@ApiTags('Configuration')
@Controller('ocpp')
export class ConfigurationOcppController {
  constructor(private readonly dispatcher: RemoteCallDispatcher) {}

  // -------- 2.0.1 --------

  @Post(ocppRoute(OCPPVersionSegment.V2_0_1, ModuleSegment.Configuration, 'reset'))
  @ApiOperation({ summary: 'Reset a connected charger (OCPP 2.0.1)' })
  reset201(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: ResetRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(OCPP_CallAction.Reset, identifier, Number(tenantId), dto(body));
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_0_1, ModuleSegment.Configuration, 'dataTransfer'))
  @ApiOperation({ summary: 'Send a vendor-specific DataTransfer to a charger (OCPP 2.0.1)' })
  dataTransfer201(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: CsmsDataTransferRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.DataTransfer,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_0_1, ModuleSegment.Configuration, 'publishFirmware'))
  @ApiOperation({ summary: 'Publish firmware (OCPP 2.0.1)' })
  publishFirmware201(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: PublishFirmwareRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.PublishFirmware,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_0_1, ModuleSegment.Configuration, 'unpublishFirmware'))
  @ApiOperation({ summary: 'Unpublish firmware (OCPP 2.0.1)' })
  unpublishFirmware201(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: UnpublishFirmwareRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.UnpublishFirmware,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_0_1, ModuleSegment.Configuration, 'triggerMessage'))
  @ApiOperation({ summary: 'Trigger an OCPP 2.0.1 message on connected chargers' })
  triggerMessage201(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: TriggerMessageRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.TriggerMessage,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_0_1, ModuleSegment.Configuration, 'changeAvailability'))
  @ApiOperation({ summary: 'Change connector availability (OCPP 2.0.1)' })
  changeAvailability201(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: ChangeAvailabilityRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.ChangeAvailability,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_0_1, ModuleSegment.Configuration, 'setNetworkProfile'))
  @ApiOperation({ summary: 'Set network profile (OCPP 2.0.1)' })
  setNetworkProfile201(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: SetNetworkProfileRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.SetNetworkProfile,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_0_1, ModuleSegment.Configuration, 'updateFirmware'))
  @ApiOperation({ summary: 'Update firmware (OCPP 2.0.1)' })
  updateFirmware201(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: UpdateFirmwareRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.UpdateFirmware,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_0_1, ModuleSegment.Configuration, 'setDisplayMessage'))
  @ApiOperation({ summary: 'Set a display message (OCPP 2.0.1)' })
  setDisplayMessage201(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: SetDisplayMessageRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.SetDisplayMessage,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_0_1, ModuleSegment.Configuration, 'clearDisplayMessage'))
  @ApiOperation({ summary: 'Clear a display message (OCPP 2.0.1)' })
  clearDisplayMessage201(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: ClearDisplayMessageRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.ClearDisplayMessage,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_0_1, ModuleSegment.Configuration, 'getDisplayMessages'))
  @ApiOperation({ summary: 'Get currently posted display messages (OCPP 2.0.1)' })
  getDisplayMessages201(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: GetDisplayMessagesRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.GetDisplayMessages,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  // -------- 2.1 (same actions as 2.0.1) --------

  @Post(ocppRoute(OCPPVersionSegment.V2_1, ModuleSegment.Configuration, 'reset'))
  @ApiOperation({ summary: 'Reset a connected charger (OCPP 2.1)' })
  reset21(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: ResetRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(OCPP_CallAction.Reset, identifier, Number(tenantId), dto(body));
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_1, ModuleSegment.Configuration, 'dataTransfer'))
  @ApiOperation({ summary: 'Send a vendor-specific DataTransfer to a charger (OCPP 2.1)' })
  dataTransfer21(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: CsmsDataTransferRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.DataTransfer,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_1, ModuleSegment.Configuration, 'publishFirmware'))
  @ApiOperation({ summary: 'Publish firmware (OCPP 2.1)' })
  publishFirmware21(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: PublishFirmwareRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.PublishFirmware,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_1, ModuleSegment.Configuration, 'unpublishFirmware'))
  @ApiOperation({ summary: 'Unpublish firmware (OCPP 2.1)' })
  unpublishFirmware21(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: UnpublishFirmwareRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.UnpublishFirmware,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_1, ModuleSegment.Configuration, 'triggerMessage'))
  @ApiOperation({ summary: 'Trigger an OCPP 2.1 message on connected chargers' })
  triggerMessage21(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: TriggerMessageRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.TriggerMessage,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_1, ModuleSegment.Configuration, 'changeAvailability'))
  @ApiOperation({ summary: 'Change connector availability (OCPP 2.1)' })
  changeAvailability21(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: ChangeAvailabilityRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.ChangeAvailability,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_1, ModuleSegment.Configuration, 'setNetworkProfile'))
  @ApiOperation({ summary: 'Set network profile (OCPP 2.1)' })
  setNetworkProfile21(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: SetNetworkProfileRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.SetNetworkProfile,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_1, ModuleSegment.Configuration, 'updateFirmware'))
  @ApiOperation({ summary: 'Update firmware (OCPP 2.1)' })
  updateFirmware21(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: UpdateFirmwareRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.UpdateFirmware,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_1, ModuleSegment.Configuration, 'setDisplayMessage'))
  @ApiOperation({ summary: 'Set a display message (OCPP 2.1)' })
  setDisplayMessage21(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: SetDisplayMessageRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.SetDisplayMessage,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_1, ModuleSegment.Configuration, 'clearDisplayMessage'))
  @ApiOperation({ summary: 'Clear a display message (OCPP 2.1)' })
  clearDisplayMessage21(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: ClearDisplayMessageRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.ClearDisplayMessage,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_1, ModuleSegment.Configuration, 'getDisplayMessages'))
  @ApiOperation({ summary: 'Get currently posted display messages (OCPP 2.1)' })
  getDisplayMessages21(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: GetDisplayMessagesRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.GetDisplayMessages,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  // -------- 1.6 --------

  @Post(ocppRoute(OCPPVersionSegment.V1_6, ModuleSegment.Configuration, 'reset'))
  @ApiOperation({ summary: 'Reset a connected charger (OCPP 1.6)' })
  reset16(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: Record<string, unknown>,
  ): Promise<MessageConfirmation[]> {
    // 1.6's Reset enum is `{ type: 'Soft' | 'Hard' }` — different from 2.0.1's
    // `{ type: 'Immediate' | 'OnIdle' | 'ImmediateAndResume' }`. Pass through
    // opaquely until we add a dedicated 1.6 DTO.
    return this.dispatcher.dispatch(OCPP_CallAction.Reset, identifier, Number(tenantId), body);
  }

  @Post(ocppRoute(OCPPVersionSegment.V1_6, ModuleSegment.Configuration, 'triggerMessage'))
  @ApiOperation({ summary: 'Trigger an OCPP 1.6 message on connected chargers' })
  triggerMessage16(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: TriggerMessage16Request,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.TriggerMessage,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V1_6, ModuleSegment.Configuration, 'changeAvailability'))
  @ApiOperation({ summary: 'Change connector availability (OCPP 1.6)' })
  changeAvailability16(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: ChangeAvailability16Request,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.ChangeAvailability,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V1_6, ModuleSegment.Configuration, 'updateFirmware'))
  @ApiOperation({ summary: 'Update firmware (OCPP 1.6)' })
  updateFirmware16(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: UpdateFirmware16Request,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.UpdateFirmware,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V1_6, ModuleSegment.Configuration, 'changeConfiguration'))
  @ApiOperation({ summary: 'Change a configuration variable (OCPP 1.6)' })
  changeConfiguration16(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: ChangeConfiguration16Request,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.ChangeConfiguration,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V1_6, ModuleSegment.Configuration, 'getConfiguration'))
  @ApiOperation({ summary: 'Read configuration variables (OCPP 1.6)' })
  getConfiguration16(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: GetConfiguration16Request,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.GetConfiguration,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V1_6, ModuleSegment.Configuration, 'dataTransfer'))
  @ApiOperation({ summary: 'Send a vendor-specific DataTransfer to a charger (OCPP 1.6)' })
  dataTransfer16(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: CsmsDataTransferRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.DataTransfer,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }
}
