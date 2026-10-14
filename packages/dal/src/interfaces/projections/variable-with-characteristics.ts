// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { VariableCharacteristicsDto, VariableDto } from '@citrineos/types';

export type VariableWithCharacteristics = VariableDto & {
  variableCharacteristics?: VariableCharacteristicsDto;
};
