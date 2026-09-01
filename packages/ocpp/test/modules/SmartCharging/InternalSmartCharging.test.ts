// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { OCPP2_0_1 } from '@citrineos/types';
import type { IChargingProfileRepository } from '@citrineos/dal';
import type { Transaction } from '@citrineos/dal';
import { InternalSmartCharging } from '@modules/SmartCharging/InternalSmartCharging.js';
import { createTestContainer } from '@test/testContainer.js';

const STATION = 'station-001';

/**
 * A truck-scale DC session: 500 A at 800 V, i.e. a 400 kW envelope, with the EV declaring a
 * 350 kW ceiling. evMaxPower is in W and evMaxCurrent in A per the OCPP 2.0.1 schema for
 * DCChargingParametersType.
 */
const EV_MAX_CURRENT_A = 500;
const EV_MAX_VOLTAGE_V = 800;
const EV_MAX_POWER_W = 350_000;

function aRequest(
  dcChargingParameters: Partial<OCPP2_0_1.DCChargingParametersType>,
): OCPP2_0_1.NotifyEVChargingNeedsRequest {
  return {
    evseId: 1,
    chargingNeeds: {
      requestedEnergyTransfer: OCPP2_0_1.EnergyTransferModeEnumType.DC,
      dcChargingParameters: dcChargingParameters as OCPP2_0_1.DCChargingParametersType,
    },
  } as OCPP2_0_1.NotifyEVChargingNeedsRequest;
}

function aTransaction(): Transaction {
  return { id: 1, transactionId: 'tx-001' } as unknown as Transaction;
}

describe('InternalSmartCharging.calculateChargingProfile', () => {
  let smartCharging: InternalSmartCharging;
  let chargingProfileRepository: Mocked<IChargingProfileRepository>;

  beforeEach(() => {
    const { logger } = createTestContainer();

    chargingProfileRepository = {
      getNextChargingProfileId: vi.fn().mockResolvedValue(1),
      getNextChargingScheduleId: vi.fn().mockResolvedValue(1),
      getNextStackLevel: vi.fn().mockResolvedValue(0),
      // No pre-existing profile, so the limit is not validated against anything.
      readAllByQuery: vi.fn().mockResolvedValue([]),
    } as unknown as Mocked<IChargingProfileRepository>;

    smartCharging = new InternalSmartCharging({
      chargingProfileRepository,
      logger: logger as never,
    });
  });

  /** The single period of the single schedule the profile is built from. */
  async function periodFor(request: OCPP2_0_1.NotifyEVChargingNeedsRequest) {
    const profile = await smartCharging.calculateChargingProfile(
      request,
      aTransaction(),
      DEFAULT_TENANT_ID,
      STATION,
    );
    const schedule = profile.chargingSchedule[0];
    return { unit: schedule.chargingRateUnit, limit: schedule.chargingSchedulePeriod[0].limit };
  }

  it('limits a DC session to the EV max power in W when power is the binding constraint', async () => {
    const { unit, limit } = await periodFor(
      aRequest({
        evMaxCurrent: EV_MAX_CURRENT_A,
        evMaxVoltage: EV_MAX_VOLTAGE_V,
        evMaxPower: EV_MAX_POWER_W,
      }),
    );

    expect(unit).toBe(OCPP2_0_1.ChargingRateUnitEnumType.W);
    expect(limit).toBe(EV_MAX_POWER_W);
  });

  it('limits a DC session to the EV max current in A when no power ceiling binds', async () => {
    const { unit, limit } = await periodFor(
      aRequest({ evMaxCurrent: EV_MAX_CURRENT_A, evMaxVoltage: EV_MAX_VOLTAGE_V }),
    );

    expect(unit).toBe(OCPP2_0_1.ChargingRateUnitEnumType.A);
    expect(limit).toBe(EV_MAX_CURRENT_A);
  });

  it('limits to current in A when the declared power exceeds the current/voltage envelope', async () => {
    const { unit, limit } = await periodFor(
      aRequest({
        evMaxCurrent: EV_MAX_CURRENT_A,
        evMaxVoltage: EV_MAX_VOLTAGE_V,
        // 500 kW declared against a 400 kW envelope: the envelope binds.
        evMaxPower: 500_000,
      }),
    );

    expect(unit).toBe(OCPP2_0_1.ChargingRateUnitEnumType.A);
    expect(limit).toBe(EV_MAX_CURRENT_A);
  });

  it('never emits a limit larger than the EV can physically accept', async () => {
    const { unit, limit } = await periodFor(
      aRequest({
        evMaxCurrent: EV_MAX_CURRENT_A,
        evMaxVoltage: EV_MAX_VOLTAGE_V,
        evMaxPower: EV_MAX_POWER_W,
      }),
    );

    // Whichever unit is chosen, the value has to be readable in that unit. A limit of
    // 350000000 W or 400000 A is not a limit, it is an unbounded profile.
    const ceiling =
      unit === OCPP2_0_1.ChargingRateUnitEnumType.W ? EV_MAX_POWER_W : EV_MAX_CURRENT_A;
    expect(limit).toBeLessThanOrEqual(ceiling);
  });
});
