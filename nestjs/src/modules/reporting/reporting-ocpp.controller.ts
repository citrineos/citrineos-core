// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Body, Controller, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OCPP_CallAction } from '@ocpp/call-action';
import { CustomerInformationRequest } from '@dto/reporting/customer-information.request';
import { GetBaseReportRequest } from '@dto/reporting/get-base-report.request';
import { GetDiagnostics16Request } from '@dto/reporting/get-diagnostics-16.request';
import { GetLogRequest } from '@dto/reporting/get-log.request';
import { GetMonitoringReportRequest } from '@dto/reporting/get-monitoring-report.request';
import { GetReportRequest } from '@dto/reporting/get-report.request';
import { MessageConfirmation } from '@remote-calls/message-confirmation.dto';
import { RemoteCallDispatcher } from '@remote-calls/remote-call.dispatcher';
import { ModuleSegment, OCPPVersionSegment, ocppRoute } from '@ocpp/route-segments';

const dto = (body: object): Record<string, unknown> => ({ ...body });

/**
 * CSMS-initiated REST endpoints under the legacy `Reporting` tag.
 * Mirrors `Server/src/Reporting/module.ts`.
 */
@ApiTags('Reporting')
@Controller('ocpp')
export class ReportingOcppController {
  constructor(private readonly dispatcher: RemoteCallDispatcher) {}

  // -------- 2.0.1 --------

  @Post(ocppRoute(OCPPVersionSegment.V2_0_1, ModuleSegment.Reporting, 'getBaseReport'))
  @ApiOperation({
    summary: 'Request a base report (full inventory / configuration / summary) (OCPP 2.0.1)',
  })
  getBaseReport201(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: GetBaseReportRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.GetBaseReport,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_0_1, ModuleSegment.Reporting, 'getReport'))
  @ApiOperation({ summary: 'Request a report (OCPP 2.0.1)' })
  getReport201(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: GetReportRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.GetReport,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_0_1, ModuleSegment.Reporting, 'getMonitoringReport'))
  @ApiOperation({ summary: 'Request a monitoring report (OCPP 2.0.1)' })
  getMonitoringReport201(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: GetMonitoringReportRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.GetMonitoringReport,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_0_1, ModuleSegment.Reporting, 'customerInformation'))
  @ApiOperation({ summary: 'Request customer information (OCPP 2.0.1)' })
  customerInformation201(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: CustomerInformationRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.CustomerInformation,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_0_1, ModuleSegment.Reporting, 'getLog'))
  @ApiOperation({ summary: 'Request a Diagnostics or Security log upload (OCPP 2.0.1)' })
  getLog201(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: GetLogRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.GetLog,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  // -------- 2.1 --------

  @Post(ocppRoute(OCPPVersionSegment.V2_1, ModuleSegment.Reporting, 'getBaseReport'))
  @ApiOperation({
    summary: 'Request a base report (full inventory / configuration / summary) (OCPP 2.1)',
  })
  getBaseReport21(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: GetBaseReportRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.GetBaseReport,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_1, ModuleSegment.Reporting, 'getReport'))
  @ApiOperation({ summary: 'Request a report (OCPP 2.1)' })
  getReport21(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: GetReportRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.GetReport,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_1, ModuleSegment.Reporting, 'getMonitoringReport'))
  @ApiOperation({ summary: 'Request a monitoring report (OCPP 2.1)' })
  getMonitoringReport21(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: GetMonitoringReportRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.GetMonitoringReport,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_1, ModuleSegment.Reporting, 'customerInformation'))
  @ApiOperation({ summary: 'Request customer information (OCPP 2.1)' })
  customerInformation21(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: CustomerInformationRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.CustomerInformation,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_1, ModuleSegment.Reporting, 'getLog'))
  @ApiOperation({ summary: 'Request a Diagnostics or Security log upload (OCPP 2.1)' })
  getLog21(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: GetLogRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.GetLog,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  // -------- 1.6 (GetDiagnostics, the precursor to 2.0.1's GetLog) --------

  @Post(ocppRoute(OCPPVersionSegment.V1_6, ModuleSegment.Reporting, 'getDiagnostics'))
  @ApiOperation({ summary: 'Request the charger to upload its diagnostics log (OCPP 1.6)' })
  getDiagnostics16(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: GetDiagnostics16Request,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.GetDiagnostics,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }
}
