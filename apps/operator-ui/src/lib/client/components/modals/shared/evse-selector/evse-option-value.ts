// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { EvseDto } from '@citrineos/types';

export const buildEvseOptionValue = (evse: Pick<EvseDto, 'id' | 'evseTypeId'>): string =>
  JSON.stringify({ id: evse.id, evseTypeId: evse.evseTypeId });
