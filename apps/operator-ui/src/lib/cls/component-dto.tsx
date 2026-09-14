// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ComponentDto } from '@citrineos/types';

export class ComponentClass implements Partial<ComponentDto> {
  id?: number;
  name?: string;
}
