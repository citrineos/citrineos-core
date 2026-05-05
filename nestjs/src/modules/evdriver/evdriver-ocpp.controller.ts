// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Body, Controller, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OCPP_CallAction } from '@ocpp/call-action';
import { CancelReservationRequest } from '@dto/evdriver/cancel-reservation.request';
import { ClearCacheRequest } from '@dto/evdriver/clear-cache.request';
import { ClearCache16Request } from '@dto/evdriver/clear-cache-16.request';
import { RemoteStartTransaction16Request } from '@dto/evdriver/remote-start-transaction-16.request';
import { RemoteStopTransaction16Request } from '@dto/evdriver/remote-stop-transaction-16.request';
import { RequestStartTransactionRequest } from '@dto/evdriver/request-start-transaction.request';
import { RequestStopTransactionRequest } from '@dto/evdriver/request-stop-transaction.request';
import { ReserveNowRequest } from '@dto/evdriver/reserve-now.request';
import { SendLocalListRequest } from '@dto/evdriver/send-local-list.request';
import { UnlockConnector16Request } from '@dto/evdriver/unlock-connector-16.request';
import { UnlockConnectorRequest } from '@dto/evdriver/unlock-connector.request';
import { LocalAuthCacheService } from '@modules/evdriver/services/local-auth-cache.service';
import { LocalAuthListVersionRepository } from '@repositories/local-auth-list-version.repository';
import { MessageConfirmation } from '@remote-calls/message-confirmation.dto';
import { RemoteCallDispatcher } from '@remote-calls/remote-call.dispatcher';
import { ModuleSegment, OCPPVersionSegment, ocppRoute } from '@ocpp/route-segments';

const dto = (body: object): Record<string, unknown> => ({ ...body });
const asArray = (id: string | string[]): string[] => (Array.isArray(id) ? id : [id]);

/**
 * CSMS-initiated REST endpoints under the legacy `EVDriver` tag.
 * Mirrors `Server/src/EVDriver/module.ts` route registrations.
 */
@ApiTags('EVDriver')
@Controller('ocpp')
export class EvDriverOcppController {
  constructor(
    private readonly dispatcher: RemoteCallDispatcher,
    private readonly localAuthCache: LocalAuthCacheService,
    private readonly localAuthListVersions: LocalAuthListVersionRepository,
  ) {}

  // -------- 2.0.1 --------

  @Post(ocppRoute(OCPPVersionSegment.V2_0_1, ModuleSegment.EVDriver, 'requestStartTransaction'))
  @ApiOperation({ summary: 'Request the charger to start a transaction (OCPP 2.0.1)' })
  requestStart201(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: RequestStartTransactionRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.RequestStartTransaction,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_0_1, ModuleSegment.EVDriver, 'requestStopTransaction'))
  @ApiOperation({ summary: 'Request the charger to stop a transaction (OCPP 2.0.1)' })
  requestStop201(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: RequestStopTransactionRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.RequestStopTransaction,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_0_1, ModuleSegment.EVDriver, 'cancelReservation'))
  @ApiOperation({ summary: 'Cancel a reservation (OCPP 2.0.1)' })
  cancelReservation201(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: CancelReservationRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.CancelReservation,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_0_1, ModuleSegment.EVDriver, 'reserveNow'))
  @ApiOperation({ summary: 'Reserve a connector (OCPP 2.0.1)' })
  reserveNow201(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: ReserveNowRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.ReserveNow,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_0_1, ModuleSegment.EVDriver, 'unlockConnector'))
  @ApiOperation({ summary: 'Unlock connector (OCPP 2.0.1)' })
  unlockConnector201(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: UnlockConnectorRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.UnlockConnector,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_0_1, ModuleSegment.EVDriver, 'clearCache'))
  @ApiOperation({ summary: 'Clear authorization cache on charger + CSMS (OCPP 2.0.1)' })
  async clearCache201(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: ClearCacheRequest,
  ): Promise<MessageConfirmation[]> {
    await this.localAuthCache.clearForStations(asArray(identifier));
    return this.dispatcher.dispatch(
      OCPP_CallAction.ClearCache,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_0_1, ModuleSegment.EVDriver, 'sendLocalList'))
  @ApiOperation({ summary: 'Send local authorization list (OCPP 2.0.1)' })
  async sendLocalList201(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: SendLocalListRequest,
  ): Promise<MessageConfirmation[]> {
    const tenant = Number(tenantId);
    const results = await this.dispatcher.dispatch(
      OCPP_CallAction.SendLocalList,
      identifier,
      tenant,
      dto(body),
    );
    // Persist the new version per accepted target so a subsequent
    // GetLocalListVersion can short-circuit.
    await Promise.all(
      asArray(identifier).map((stationId, i) => {
        if (results[i]?.success) {
          return this.localAuthListVersions.upsertVersion({
            tenantId: tenant,
            stationId,
            versionNumber: body.versionNumber,
          });
        }
        return Promise.resolve();
      }),
    );
    return results;
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_0_1, ModuleSegment.EVDriver, 'getLocalListVersion'))
  @ApiOperation({ summary: 'Get local list version (OCPP 2.0.1)' })
  getLocalListVersion201(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: Record<string, unknown>,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.GetLocalListVersion,
      identifier,
      Number(tenantId),
      body,
    );
  }

  // -------- 2.1 (same actions as 2.0.1) --------

  @Post(ocppRoute(OCPPVersionSegment.V2_1, ModuleSegment.EVDriver, 'requestStartTransaction'))
  @ApiOperation({ summary: 'Request the charger to start a transaction (OCPP 2.1)' })
  requestStart21(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: RequestStartTransactionRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.RequestStartTransaction,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_1, ModuleSegment.EVDriver, 'requestStopTransaction'))
  @ApiOperation({ summary: 'Request the charger to stop a transaction (OCPP 2.1)' })
  requestStop21(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: RequestStopTransactionRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.RequestStopTransaction,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_1, ModuleSegment.EVDriver, 'cancelReservation'))
  @ApiOperation({ summary: 'Cancel a reservation (OCPP 2.1)' })
  cancelReservation21(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: CancelReservationRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.CancelReservation,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_1, ModuleSegment.EVDriver, 'reserveNow'))
  @ApiOperation({ summary: 'Reserve a connector (OCPP 2.1)' })
  reserveNow21(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: ReserveNowRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.ReserveNow,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_1, ModuleSegment.EVDriver, 'unlockConnector'))
  @ApiOperation({ summary: 'Unlock connector (OCPP 2.1)' })
  unlockConnector21(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: UnlockConnectorRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.UnlockConnector,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_1, ModuleSegment.EVDriver, 'clearCache'))
  @ApiOperation({ summary: 'Clear authorization cache on charger + CSMS (OCPP 2.1)' })
  async clearCache21(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: ClearCacheRequest,
  ): Promise<MessageConfirmation[]> {
    await this.localAuthCache.clearForStations(asArray(identifier));
    return this.dispatcher.dispatch(
      OCPP_CallAction.ClearCache,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_1, ModuleSegment.EVDriver, 'sendLocalList'))
  @ApiOperation({ summary: 'Send local authorization list (OCPP 2.1)' })
  async sendLocalList21(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: SendLocalListRequest,
  ): Promise<MessageConfirmation[]> {
    const tenant = Number(tenantId);
    const results = await this.dispatcher.dispatch(
      OCPP_CallAction.SendLocalList,
      identifier,
      tenant,
      dto(body),
    );
    await Promise.all(
      asArray(identifier).map((stationId, i) => {
        if (results[i]?.success) {
          return this.localAuthListVersions.upsertVersion({
            tenantId: tenant,
            stationId,
            versionNumber: body.versionNumber,
          });
        }
        return Promise.resolve();
      }),
    );
    return results;
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_1, ModuleSegment.EVDriver, 'getLocalListVersion'))
  @ApiOperation({ summary: 'Get local list version (OCPP 2.1)' })
  getLocalListVersion21(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: Record<string, unknown>,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.GetLocalListVersion,
      identifier,
      Number(tenantId),
      body,
    );
  }

  // -------- 1.6 (different action set: RemoteStart/Stop instead of RequestStart/Stop) --------

  @Post(ocppRoute(OCPPVersionSegment.V1_6, ModuleSegment.EVDriver, 'remoteStartTransaction'))
  @ApiOperation({ summary: 'Request the charger to start a transaction (OCPP 1.6)' })
  remoteStart16(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: RemoteStartTransaction16Request,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.RemoteStartTransaction,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V1_6, ModuleSegment.EVDriver, 'remoteStopTransaction'))
  @ApiOperation({ summary: 'Request the charger to stop a transaction (OCPP 1.6)' })
  remoteStop16(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: RemoteStopTransaction16Request,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.RemoteStopTransaction,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V1_6, ModuleSegment.EVDriver, 'unlockConnector'))
  @ApiOperation({ summary: 'Unlock connector (OCPP 1.6)' })
  unlockConnector16(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: UnlockConnector16Request,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.UnlockConnector,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V1_6, ModuleSegment.EVDriver, 'clearCache'))
  @ApiOperation({ summary: 'Clear authorization cache on charger + CSMS (OCPP 1.6)' })
  async clearCache16(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: ClearCache16Request,
  ): Promise<MessageConfirmation[]> {
    await this.localAuthCache.clearForStations(asArray(identifier));
    return this.dispatcher.dispatch(
      OCPP_CallAction.ClearCache,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }
}
