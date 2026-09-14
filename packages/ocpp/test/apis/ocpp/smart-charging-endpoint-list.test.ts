// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { OCPP_CallAction } from '@citrineos/types';
import { SMART_CHARGING_MESSAGE_ENDPOINTS } from '@/apis/ocpp/2/smart-charging.js';

/**
 * A message endpoint forwards a CALL from the operator API to the station, so it can only carry an
 * action the CSMS sends. Part 2 defines these smart charging messages as sent by the Charging
 * Station to the CSMS: a station that receives one of them as a CALL answers NotImplemented.
 */
const STATION_TO_CSMS = [
  OCPP_CallAction.ClearedChargingLimit,
  OCPP_CallAction.NotifyChargingLimit,
  OCPP_CallAction.NotifyEVChargingNeeds,
  OCPP_CallAction.NotifyEVChargingSchedule,
  OCPP_CallAction.ReportChargingProfiles,
];

describe('smart charging message endpoints', () => {
  it('only forward actions the CSMS sends to the station', () => {
    const actions = SMART_CHARGING_MESSAGE_ENDPOINTS.map((endpoint) => endpoint.route.action);

    expect(actions).toEqual([
      OCPP_CallAction.ClearChargingProfile,
      OCPP_CallAction.GetChargingProfiles,
      OCPP_CallAction.SetChargingProfile,
      OCPP_CallAction.GetCompositeSchedule,
    ]);
    expect(actions.filter((action) => STATION_TO_CSMS.includes(action))).toEqual([]);
  });
});
