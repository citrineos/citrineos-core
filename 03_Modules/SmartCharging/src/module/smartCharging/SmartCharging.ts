// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  ChargingProfileType,
  NotifyEVChargingNeedsRequest,
  NotifyEVChargingScheduleRequest,
} from '@citrineos/base';
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
    request: NotifyEVChargingNeedsRequest,
    transaction: Transaction,
    stationId: string,
  ): Promise<ChargingProfileType>;

  /**
   * Inteface for checking EV charging schedule is within limits of CSMS ChargingSchedule
   *
   * @param {NotifyEVChargingScheduleRequest} request - EV charging schedule request
   * @param {Transaction} transaction
   * @param {string} stationId
   **/
  checkLimitsOfChargingSchedule(
    request: NotifyEVChargingScheduleRequest,
    stationId: string,
    transaction: Transaction,
  ): Promise<void>;
}
