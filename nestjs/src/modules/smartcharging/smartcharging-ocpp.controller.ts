// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Body, Controller, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OCPP_CallAction } from '@ocpp/call-action';
import { ClearChargingProfileRequest } from '@dto/smartcharging/clear-charging-profile.request';
import { ClearChargingProfile16Request } from '@dto/smartcharging/clear-charging-profile-16.request';
import { GetCompositeScheduleRequest } from '@dto/smartcharging/get-composite-schedule.request';
import { GetCompositeSchedule16Request } from '@dto/smartcharging/get-composite-schedule-16.request';
import { SetChargingProfileRequest } from '@dto/smartcharging/set-charging-profile.request';
import { SetChargingProfile16Request } from '@dto/smartcharging/set-charging-profile-16.request';
import { GetChargingProfilesRequest } from '@dto/smartcharging/get-charging-profiles.request';
import { MessageConfirmation } from '@remote-calls/message-confirmation.dto';
import { RemoteCallDispatcher } from '@remote-calls/remote-call.dispatcher';
import { ModuleSegment, OCPPVersionSegment, ocppRoute } from '@ocpp/route-segments';

const dto = (body: object): Record<string, unknown> => ({ ...body });

/**
 * CSMS-initiated REST endpoints under the legacy `SmartCharging` tag.
 * Mirrors `Server/src/SmartCharging/module.ts`.
 */
@ApiTags('SmartCharging')
@Controller('ocpp')
export class SmartChargingOcppController {
  constructor(private readonly dispatcher: RemoteCallDispatcher) {}

  // -------- 2.0.1 --------

  @Post(ocppRoute(OCPPVersionSegment.V2_0_1, ModuleSegment.SmartCharging, 'setChargingProfile'))
  @ApiOperation({ summary: 'Set a charging profile (OCPP 2.0.1)' })
  setChargingProfile201(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: SetChargingProfileRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.SetChargingProfile,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_0_1, ModuleSegment.SmartCharging, 'clearChargingProfile'))
  @ApiOperation({ summary: 'Clear a charging profile (OCPP 2.0.1)' })
  clearChargingProfile201(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: ClearChargingProfileRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.ClearChargingProfile,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_0_1, ModuleSegment.SmartCharging, 'getCompositeSchedule'))
  @ApiOperation({ summary: 'Request the composite schedule (OCPP 2.0.1)' })
  getCompositeSchedule201(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: GetCompositeScheduleRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.GetCompositeSchedule,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_0_1, ModuleSegment.SmartCharging, 'getChargingProfiles'))
  @ApiOperation({ summary: 'Get charging profiles (OCPP 2.0.1)' })
  getChargingProfiles201(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: GetChargingProfilesRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.GetChargingProfiles,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  // -------- 2.1 --------

  @Post(ocppRoute(OCPPVersionSegment.V2_1, ModuleSegment.SmartCharging, 'setChargingProfile'))
  @ApiOperation({ summary: 'Set a charging profile (OCPP 2.1)' })
  setChargingProfile21(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: SetChargingProfileRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.SetChargingProfile,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_1, ModuleSegment.SmartCharging, 'clearChargingProfile'))
  @ApiOperation({ summary: 'Clear a charging profile (OCPP 2.1)' })
  clearChargingProfile21(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: ClearChargingProfileRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.ClearChargingProfile,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_1, ModuleSegment.SmartCharging, 'getCompositeSchedule'))
  @ApiOperation({ summary: 'Request the composite schedule (OCPP 2.1)' })
  getCompositeSchedule21(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: GetCompositeScheduleRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.GetCompositeSchedule,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_1, ModuleSegment.SmartCharging, 'getChargingProfiles'))
  @ApiOperation({ summary: 'Get charging profiles (OCPP 2.1)' })
  getChargingProfiles21(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: GetChargingProfilesRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.GetChargingProfiles,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  // -------- 1.6 --------

  @Post(ocppRoute(OCPPVersionSegment.V1_6, ModuleSegment.SmartCharging, 'setChargingProfile'))
  @ApiOperation({ summary: 'Set a charging profile (OCPP 1.6)' })
  setChargingProfile16(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: SetChargingProfile16Request,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.SetChargingProfile,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V1_6, ModuleSegment.SmartCharging, 'clearChargingProfile'))
  @ApiOperation({ summary: 'Clear a charging profile (OCPP 1.6)' })
  clearChargingProfile16(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: ClearChargingProfile16Request,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.ClearChargingProfile,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V1_6, ModuleSegment.SmartCharging, 'getCompositeSchedule'))
  @ApiOperation({ summary: 'Request the composite schedule (OCPP 1.6)' })
  getCompositeSchedule16(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: GetCompositeSchedule16Request,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.GetCompositeSchedule,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }
}
