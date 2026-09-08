// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DataEnum } from '@citrineos/types';
import type { IDeviceModelRepository } from '@citrineos/dal';
import { stringToSet } from '@util/index.js';
import type { ILogObj, Logger } from 'tslog';

export async function readChargingRateUnitMemberList(
  deviceModelRepository: IDeviceModelRepository,
  tenantId: number,
  logger: Logger<ILogObj>,
): Promise<Set<string> | undefined> {
  const chargingScheduleChargingRateUnit =
    await deviceModelRepository.findVariableCharacteristicsByVariableNameAndVariableInstance(
      tenantId,
      'RateUnit',
      null,
    );
  logger.info(`Found RateUnit: ${JSON.stringify(chargingScheduleChargingRateUnit)}`);
  if (
    chargingScheduleChargingRateUnit &&
    chargingScheduleChargingRateUnit.dataType === DataEnum.MemberList &&
    chargingScheduleChargingRateUnit.valuesList
  ) {
    return stringToSet(chargingScheduleChargingRateUnit.valuesList);
  }
}
