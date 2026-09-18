// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { AttributeEnum } from '@citrineos/types';
import type { IChargingProfileRepository, IVariableAttributeRepository } from '@citrineos/dal';

export async function generateChargingProfileId(
  chargingProfileRepository: IChargingProfileRepository,
  variableAttributeRepository: IVariableAttributeRepository,
  tenantId: number,
  ocppConnectionName: string,
): Promise<number> {
  const nextChargingProfileId = await chargingProfileRepository.getNextChargingProfileId(
    tenantId,
    ocppConnectionName,
  );
  const maxExternalConstraintsIds = await variableAttributeRepository.readAllByQuerystring(
    tenantId,
    {
      tenantId,
      ocppConnectionName,
      component_name: 'SmartChargingCtrlr',
      variable_name: 'MaxExternalConstraintsId',
      type: AttributeEnum.Actual,
    },
  );
  const maxExternalConstraintsId = Number(maxExternalConstraintsIds[0]?.value);
  return Number.isInteger(maxExternalConstraintsId)
    ? Math.max(nextChargingProfileId, maxExternalConstraintsId + 1)
    : nextChargingProfileId;
}
