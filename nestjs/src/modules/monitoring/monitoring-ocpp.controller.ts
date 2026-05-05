// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Body, Controller, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OCPP_CallAction } from '@ocpp/call-action';
import { ClearVariableMonitoringRequest } from '@dto/monitoring/clear-variable-monitoring.request';
import { GetVariablesRequest } from '@dto/monitoring/get-variables.request';
import { SetMonitoringBaseRequest } from '@dto/monitoring/set-monitoring-base.request';
import { SetMonitoringLevelRequest } from '@dto/monitoring/set-monitoring-level.request';
import { SetVariableMonitoringRequest } from '@dto/monitoring/set-variable-monitoring.request';
import { SetVariablesRequest } from '@dto/monitoring/set-variables.request';
import { MessageConfirmation } from '@remote-calls/message-confirmation.dto';
import { RemoteCallDispatcher } from '@remote-calls/remote-call.dispatcher';
import { ModuleSegment, OCPPVersionSegment, ocppRoute } from '@ocpp/route-segments';

const dto = (body: object): Record<string, unknown> => ({ ...body });

/**
 * CSMS-initiated REST endpoints under the legacy `Monitoring` tag.
 * Mirrors `Server/src/Monitoring/module.ts`.
 */
@ApiTags('Monitoring')
@Controller('ocpp')
export class MonitoringOcppController {
  constructor(private readonly dispatcher: RemoteCallDispatcher) {}

  // -------- 2.0.1 --------

  @Post(ocppRoute(OCPPVersionSegment.V2_0_1, ModuleSegment.Monitoring, 'setVariableMonitoring'))
  @ApiOperation({ summary: 'Set variable monitoring rules (OCPP 2.0.1)' })
  setVariableMonitoring201(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: SetVariableMonitoringRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.SetVariableMonitoring,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_0_1, ModuleSegment.Monitoring, 'clearVariableMonitoring'))
  @ApiOperation({ summary: 'Clear variable monitoring rules (OCPP 2.0.1)' })
  clearVariableMonitoring201(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: ClearVariableMonitoringRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.ClearVariableMonitoring,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_0_1, ModuleSegment.Monitoring, 'setMonitoringLevel'))
  @ApiOperation({ summary: 'Set the monitoring severity level (OCPP 2.0.1)' })
  setMonitoringLevel201(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: SetMonitoringLevelRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.SetMonitoringLevel,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_0_1, ModuleSegment.Monitoring, 'setMonitoringBase'))
  @ApiOperation({ summary: 'Set the monitoring base set (OCPP 2.0.1)' })
  setMonitoringBase201(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: SetMonitoringBaseRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.SetMonitoringBase,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_0_1, ModuleSegment.Monitoring, 'setVariables'))
  @ApiOperation({ summary: 'Set device-model variables (OCPP 2.0.1)' })
  setVariables201(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: SetVariablesRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.SetVariables,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_0_1, ModuleSegment.Monitoring, 'getVariables'))
  @ApiOperation({ summary: 'Get device-model variables (OCPP 2.0.1)' })
  getVariables201(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: GetVariablesRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.GetVariables,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  // -------- 2.1 --------

  @Post(ocppRoute(OCPPVersionSegment.V2_1, ModuleSegment.Monitoring, 'setVariableMonitoring'))
  @ApiOperation({ summary: 'Set variable monitoring rules (OCPP 2.1)' })
  setVariableMonitoring21(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: SetVariableMonitoringRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.SetVariableMonitoring,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_1, ModuleSegment.Monitoring, 'clearVariableMonitoring'))
  @ApiOperation({ summary: 'Clear variable monitoring rules (OCPP 2.1)' })
  clearVariableMonitoring21(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: ClearVariableMonitoringRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.ClearVariableMonitoring,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_1, ModuleSegment.Monitoring, 'setMonitoringLevel'))
  @ApiOperation({ summary: 'Set the monitoring severity level (OCPP 2.1)' })
  setMonitoringLevel21(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: SetMonitoringLevelRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.SetMonitoringLevel,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_1, ModuleSegment.Monitoring, 'setMonitoringBase'))
  @ApiOperation({ summary: 'Set the monitoring base set (OCPP 2.1)' })
  setMonitoringBase21(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: SetMonitoringBaseRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.SetMonitoringBase,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_1, ModuleSegment.Monitoring, 'setVariables'))
  @ApiOperation({ summary: 'Set device-model variables (OCPP 2.1)' })
  setVariables21(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: SetVariablesRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.SetVariables,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_1, ModuleSegment.Monitoring, 'getVariables'))
  @ApiOperation({ summary: 'Get device-model variables (OCPP 2.1)' })
  getVariables21(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: GetVariablesRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.GetVariables,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }
}
