// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { VariableDto } from '@citrineos/types';

export class VariableClass implements Partial<VariableDto> {
  id?: number;
  name?: string;
}
