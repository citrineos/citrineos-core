// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Injectable, Logger } from '@nestjs/common';
import { BootRepository } from '@repositories/boot.repository';
import { CacheService } from '@cache/cache.service';
import { OCPP_CallAction } from '@ocpp/call-action';
import { RegistrationStatusEnumType } from '@enums/registration-status.enum';
import { RemoteCallsService } from '@remote-calls/remote-calls.service';

/** Cache namespace marking that follow-up CSMS calls have been dispatched for this Pending session. */
const BOOT_PENDING_DISPATCHED = 'BOOT_PENDING_DISPATCHED';

/**
 * Drives the OCPP 2.0.1 / 2.1 Pending → Accepted handshake.
 *
 * When a BootNotification response leaves the charger in `Pending` state,
 * the CSMS can use that window to:
 *   1. Pull the charger's full device-model snapshot via `GetBaseReport`
 *      (if `boots.getBaseReportOnPending` is set).
 *   2. Push any variable values the previous boot rejected via
 *      `SetVariables` (entries from `boots.variablesRejectedOnLastBoot`).
 *
 * Both calls go through `RemoteCallsService` like any other CSMS-initiated
 * call. Their responses (NotifyReport / SetVariablesResponse) are handled
 * by the existing reporting / monitoring handler chain — this service
 * only owns the *dispatch* side.
 *
 * To avoid re-dispatching on every Pending boot we set a per-station cache
 * marker (`BOOT_PENDING_DISPATCHED`) and clear it once the row transitions
 * to Accepted. Mirrors `core/src/modules/Configuration/src/module/module.ts`.
 */
@Injectable()
export class BootPendingService {
  private readonly logger = new Logger(BootPendingService.name);

  constructor(
    private readonly bootRepo: BootRepository,
    private readonly cache: CacheService,
    private readonly remoteCalls: RemoteCallsService,
  ) {}

  /**
   * Called after the BootNotification response has been sent to the charger.
   * Inspects the response status:
   *   - Accepted     → clear any cached "dispatched" marker and return.
   *   - Pending      → dispatch the configured follow-ups once.
   *   - Rejected     → no-op.
   */
  async onBootResponse(
    tenantId: number,
    stationId: string,
    responseStatus: RegistrationStatusEnumType,
  ): Promise<void> {
    if (responseStatus === RegistrationStatusEnumType.Accepted) {
      await this.cache.remove(BOOT_PENDING_DISPATCHED, stationId);
      return;
    }
    if (responseStatus !== RegistrationStatusEnumType.Pending) return;

    const alreadyDispatched = await this.cache.get<string>(BOOT_PENDING_DISPATCHED, stationId);
    if (alreadyDispatched) {
      this.logger.debug(`Pending follow-ups already dispatched for ${stationId}; skipping`);
      return;
    }

    const boot = await this.bootRepo.findByStationId(tenantId, stationId);
    if (!boot) return;

    const dispatched: string[] = [];
    if (boot.getBaseReportOnPending) {
      await this.dispatchGetBaseReport(tenantId, stationId);
      dispatched.push(OCPP_CallAction.GetBaseReport);
    }

    const rejectedVars = (boot.variablesRejectedOnLastBoot ?? null) as unknown[] | null;
    if (Array.isArray(rejectedVars) && rejectedVars.length > 0) {
      await this.dispatchSetVariables(tenantId, stationId, rejectedVars);
      dispatched.push(OCPP_CallAction.SetVariables);
    }

    if (dispatched.length > 0) {
      await this.cache.set(BOOT_PENDING_DISPATCHED, dispatched.join(','), stationId);
      this.logger.log(`Boot Pending follow-ups for ${stationId}: ${dispatched.join(', ')}`);
    }
  }

  /**
   * Called by `NotifyReportHandler` after a successful ingest. Coarse
   * signal: the charger answered our GetBaseReport, so the
   * `getBaseReportOnPending` flag can come down. The next BootNotification
   * inspects this flag to decide whether to promote Pending → Accepted.
   */
  async onNotifyReportIngested(tenantId: number, stationId: string): Promise<void> {
    const boot = await this.bootRepo.findByStationId(tenantId, stationId);
    if (!boot?.getBaseReportOnPending) return;
    await this.bootRepo.setGetBaseReportOnPending(tenantId, stationId, false);
    this.logger.debug(`Cleared getBaseReportOnPending for ${stationId} (NotifyReport received)`);
  }

  private async dispatchGetBaseReport(tenantId: number, stationId: string): Promise<void> {
    try {
      await this.remoteCalls.sendAndAwait(
        OCPP_CallAction.GetBaseReport,
        stationId,
        tenantId,
        { requestId: Date.now(), reportBase: 'FullInventory' },
        60,
      );
      // The charger has acknowledged the GetBaseReport CALL. The actual
      // NotifyReport with the data lands separately and clears the flag
      // via `onNotifyReportIngested`.
    } catch (err) {
      this.logger.warn(`GetBaseReport for ${stationId} failed: ${(err as Error).message}`);
    }
  }

  private async dispatchSetVariables(
    tenantId: number,
    stationId: string,
    rejected: unknown[],
  ): Promise<void> {
    try {
      const response = await this.remoteCalls.sendAndAwait<{
        setVariableResult?: Array<{
          attributeStatus?: string;
          component?: unknown;
          variable?: unknown;
        }>;
      }>(OCPP_CallAction.SetVariables, stationId, tenantId, { setVariableData: rejected }, 60);
      // Capture rejections (anything not Accepted) so the next Pending
      // boot retries them. Empty array → all accepted, ready to promote.
      const stillRejected = (response.setVariableResult ?? [])
        .filter((r) => r.attributeStatus !== 'Accepted')
        .map((r) => ({ component: r.component, variable: r.variable }));
      await this.bootRepo.setVariablesRejectedOnLastBoot(tenantId, stationId, stillRejected);
      this.logger.debug(
        `SetVariables for ${stationId}: ${stillRejected.length} still rejected of ${rejected.length}`,
      );
    } catch (err) {
      this.logger.warn(`SetVariables for ${stationId} failed: ${(err as Error).message}`);
    }
  }
}
