// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP2_0_1 } from '@citrineos/base';
import { Transaction } from '@citrineos/data';

export interface ISmartCharging {
  /**
   * Interface for calculating charging profile based on the charging needs
   *
   * @param {NotifyEVChargingNeedsRequest} request - charging need request
   * @param {Transaction} transaction
   * @param {string} stationId
   *
   * @returns {Promise<ChargingProfileType>} charging profile
   **/
  calculateChargingProfile(
    request: OCPP2_0_1.NotifyEVChargingNeedsRequest,
    transaction: Transaction,
    tenantId: number,
    stationId: string,
  ): Promise<OCPP2_0_1.ChargingProfileType>;

  /**
   * Inteface for checking EV charging schedule is within limits of CSMS ChargingSchedule
   *
   * @param {NotifyEVChargingScheduleRequest} request - EV charging schedule request
   * @param {Transaction} transaction
   * @param {string} stationId
   **/
  checkLimitsOfChargingSchedule(
    request: OCPP2_0_1.NotifyEVChargingScheduleRequest,
    tenantId: number,
    stationId: string,
    transaction: Transaction,
  ): Promise<void>;
}
