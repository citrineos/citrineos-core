// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Body, Controller, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OCPP_CallAction } from '@ocpp/call-action';
import { CostUpdatedRequest } from '@dto/transactions/cost-updated.request';
import { GetTransactionStatusRequest } from '@dto/transactions/get-transaction-status.request';
import { SetDefaultTariffRequest } from '@dto/transactions/set-default-tariff.request';
import { MessageConfirmation } from '@remote-calls/message-confirmation.dto';
import { RemoteCallDispatcher } from '@remote-calls/remote-call.dispatcher';
import { ModuleSegment, OCPPVersionSegment, ocppRoute } from '@ocpp/route-segments';

const dto = (body: object): Record<string, unknown> => ({ ...body });

/**
 * CSMS-initiated REST endpoints under the legacy `Transactions` tag.
 * Mirrors `Server/src/Transactions/module.ts`.
 *
 * Three actions live here:
 *   - `CostUpdated` (2.0.1, 2.1) — periodic cost notification. Usually
 *     fired by the in-process `CostNotifier` rather than externally,
 *     but exposed for operator override.
 *   - `GetTransactionStatus` (2.0.1, 2.1) — query the charger for the
 *     status of an in-flight (or recently completed) transaction.
 *   - `SetDefaultTariff` (2.1 only) — push a default tariff to an EVSE.
 */
@ApiTags('Transactions')
@Controller('ocpp')
export class TransactionsOcppController {
  constructor(private readonly dispatcher: RemoteCallDispatcher) {}

  // -------- 2.0.1 --------

  @Post(ocppRoute(OCPPVersionSegment.V2_0_1, ModuleSegment.Transactions, 'costUpdated'))
  @ApiOperation({ summary: 'Send a CostUpdated notification (OCPP 2.0.1)' })
  costUpdated201(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: CostUpdatedRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.CostUpdated,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_0_1, ModuleSegment.Transactions, 'getTransactionStatus'))
  @ApiOperation({ summary: 'Query in-flight transaction status (OCPP 2.0.1)' })
  getTransactionStatus201(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: GetTransactionStatusRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.GetTransactionStatus,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  // -------- 2.1 --------

  @Post(ocppRoute(OCPPVersionSegment.V2_1, ModuleSegment.Transactions, 'costUpdated'))
  @ApiOperation({ summary: 'Send a CostUpdated notification (OCPP 2.1)' })
  costUpdated21(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: CostUpdatedRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.CostUpdated,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_1, ModuleSegment.Transactions, 'getTransactionStatus'))
  @ApiOperation({ summary: 'Query in-flight transaction status (OCPP 2.1)' })
  getTransactionStatus21(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: GetTransactionStatusRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.GetTransactionStatus,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_1, ModuleSegment.Transactions, 'setDefaultTariff'))
  @ApiOperation({ summary: 'Set the default tariff for an EVSE (OCPP 2.1 only)' })
  setDefaultTariff21(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: SetDefaultTariffRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.SetDefaultTariff,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }
}
