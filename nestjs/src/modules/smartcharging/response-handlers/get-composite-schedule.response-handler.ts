// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP_CallAction } from '@ocpp/call-action';
import { OcppResponseHandler } from '@ocpp/ocpp-handler.decorator';
import { CsmsResponseHandler, CsmsResponseMessage } from '@ocpp/csms-response-handler';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { CompositeScheduleRepository } from '@repositories/composite-schedule.repository';

interface ChargingSchedulePeriodType extends Record<string, unknown> {
  startPeriod: number;
  limit: number;
  numberPhases?: number;
}

interface CompositeScheduleType {
  evseId: number;
  duration: number;
  scheduleStart: string;
  chargingRateUnit: string;
  chargingSchedulePeriod: ChargingSchedulePeriodType[];
}

interface GetCompositeScheduleResponse {
  status: 'Accepted' | 'Rejected';
  schedule?: CompositeScheduleType;
  statusInfo?: { reasonCode: string; additionalInfo?: string };
}

/**
 * Response handler for OCPP 2.0.1 / 2.1 / 1.6 `GetCompositeSchedule`.
 *
 * Mirrors legacy `_handleGetCompositeSchedule`. Persists each accepted
 * snapshot as its own row in `CompositeSchedules`.
 */
@OcppResponseHandler(OCPP_CallAction.GetCompositeSchedule, [
  OCPPVersion.OCPP2_0_1,
  OCPPVersion.OCPP2_1,
  OCPPVersion.OCPP1_6,
])
export class GetCompositeScheduleResponseHandler extends CsmsResponseHandler<GetCompositeScheduleResponse> {
  constructor(private readonly schedules: CompositeScheduleRepository) {
    super();
  }

  async handle(msg: CsmsResponseMessage<GetCompositeScheduleResponse>): Promise<void> {
    const { stationId, tenantId } = msg.context;
    const { status, schedule } = msg.payload;
    if (status !== 'Accepted' || !schedule) {
      this.logger.debug(
        `GetCompositeSchedule ${stationId}: status=${status}; schedule=${schedule ? 'present' : 'absent'}`,
      );
      return;
    }
    await this.schedules.insert({
      stationId,
      tenantId,
      evseId: schedule.evseId,
      duration: schedule.duration,
      scheduleStart: schedule.scheduleStart ? new Date(schedule.scheduleStart) : null,
      chargingRateUnit: schedule.chargingRateUnit,
      chargingSchedulePeriod: schedule.chargingSchedulePeriod,
    });
    this.logger.debug(
      `GetCompositeSchedule ${stationId}/evse=${schedule.evseId}: persisted ${schedule.chargingSchedulePeriod.length} period(s)`,
    );
  }
}
