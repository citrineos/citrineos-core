// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP_CallAction } from '@ocpp/call-action';
import { OcppHandler } from '@ocpp/ocpp-handler.decorator';
import { OcppMessage, OcppRequestHandler } from '@ocpp/ocpp-request-handler';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { ReportChargingProfilesRequest } from '@dto/smartcharging/report-charging-profiles.request';
import { ChargingProfileRepository } from '@repositories/charging-profile.repository';
import { WebhookService } from '@webhooks/webhook.service';
import { WebhookEvent } from '@webhooks/webhook-events';

/**
 * ReportChargingProfiles (OCPP 2.0.1 / 2.1).
 *
 * Charger reports installed charging profiles (in response to a CSMS
 * GetChargingProfiles request, or unsolicited after a TX-end). Each
 * profile is upserted on the OCPP natural key
 * `(tenantId, stationId, evseId, chargingProfileId, stackLevel)`
 * — mirrors legacy `createOrUpdateChargingProfile` so a re-reported
 * profile updates the existing row instead of duplicating. The `tbc`
 * flag indicates whether further parts are coming and is forwarded
 * with the webhook payload.
 *
 * Schema gap: legacy also persists `chargingLimitSource`. The entity
 * does not yet expose that column (F2 Phase C drift cleanup) — it is
 * surfaced on the webhook payload but not the DB row.
 */
@OcppHandler(
  OCPP_CallAction.ReportChargingProfiles,
  [OCPPVersion.OCPP2_0_1, OCPPVersion.OCPP2_1],
  ReportChargingProfilesRequest,
)
export class ReportChargingProfilesHandler extends OcppRequestHandler<ReportChargingProfilesRequest> {
  constructor(
    private readonly chargingProfileRepo: ChargingProfileRepository,
    private readonly webhooks: WebhookService,
  ) {
    super();
  }

  async handle(msg: OcppMessage<ReportChargingProfilesRequest>): Promise<Record<string, unknown>> {
    const { stationId, tenantId } = msg.context;
    const { chargingProfile, evseId, chargingLimitSource, tbc } = msg.payload;

    this.logger.debug(
      `ReportChargingProfiles from ${stationId}: ${chargingProfile.length} profiles, evseId=${evseId}, source=${chargingLimitSource}, tbc=${tbc}`,
    );

    for (const profile of chargingProfile) {
      // Note: legacy stores schedule data in the separate
      // `ChargingSchedules` table; the `profile.chargingSchedule` array
      // would be persisted there. Schedule persistence is owed once
      // `ChargingSchedules` ↔ profile FK wiring lands.
      await this.chargingProfileRepo.upsertByOcppKey({
        stationId,
        evseId: evseId ?? null,
        id: profile.id,
        stackLevel: profile.stackLevel,
        chargingProfilePurpose: profile.chargingProfilePurpose,
        chargingProfileKind: profile.chargingProfileKind,
        recurrencyKind: profile.recurrencyKind ?? null,
        validFrom: profile.validFrom ? new Date(profile.validFrom) : null,
        validTo: profile.validTo ? new Date(profile.validTo) : null,
        chargingLimitSource: chargingLimitSource ?? null,
        isActive: true,
        tenantId,
      });
    }

    this.webhooks.emit(
      WebhookEvent.SmartChargingReportChargingProfiles,
      { ...msg.payload },
      { stationId, tenantId },
    );

    return {};
  }
}
