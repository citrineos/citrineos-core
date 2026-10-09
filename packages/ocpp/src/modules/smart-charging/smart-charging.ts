// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP2_1, type TransactionDto } from '@citrineos/types';

export interface ISmartCharging {
  /**
   * Interface for calculating charging profile based on the charging needs
   *
   * @param {NotifyEVChargingNeedsRequest} request - charging need request
   * @param {TransactionDto} transaction
   * @param ocppConnectionName - The connection name of the charging station
   *
   * @returns {Promise<ChargingProfileType>} charging profile
   **/
  calculateChargingProfile(
    request: OCPP2_1.NotifyEVChargingNeedsRequest,
    transaction: TransactionDto,
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<OCPP2_1.ChargingProfileType>;

  /**
   * Inteface for checking EV charging schedule is within limits of CSMS ChargingSchedule
   *
   * @param {NotifyEVChargingScheduleRequest} request - EV charging schedule request
   * @param {TransactionDto} transaction
   * @param ocppConnectionName - The connection name of the charging station
   **/
  checkLimitsOfChargingSchedule(
    request: OCPP2_1.NotifyEVChargingScheduleRequest,
    tenantId: number,
    ocppConnectionName: string,
    transaction: TransactionDto,
  ): Promise<void>;
}
