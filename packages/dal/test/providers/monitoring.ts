// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { OCPP2_0_1 } from '@citrineos/types';
import { applyUpdateFunction, type UpdateFunction } from '../utils/update-util.js';

export const aGetVariableResult = (
  updateFunction?: UpdateFunction<OCPP2_0_1.GetVariableResultType>,
): OCPP2_0_1.GetVariableResultType => {
  const result: OCPP2_0_1.GetVariableResultType = {
    component: { name: 'TestComponent' },
    variable: { name: 'TestVariable' },
    attributeStatus: OCPP2_0_1.GetVariableStatusEnumType.Accepted,
    attributeType: OCPP2_0_1.AttributeEnumType.Actual,
    attributeValue: 'test-value',
  };
  return applyUpdateFunction(result, updateFunction);
};
