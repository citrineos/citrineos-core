// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { EvseDto } from '@citrineos/types';

/**
 * Builds the value {@link EvseSelector} puts on each combobox option, and the value a caller must
 * hold in the form for one of those options to render as selected.
 *
 * Both sides go through here on purpose. The combobox matches on these strings rather than on the
 * objects they encode, so a second hand-written JSON.stringify elsewhere would silently stop
 * matching the moment either key or its order changed - the symptom being a placeholder shown over
 * a form that does hold a value.
 *
 * Connectors need the EVSE's `id` (the database ID) while operators recognise it by `evseTypeId`
 * (the serial integer starting at 1), so the value carries both.
 */
export const buildEvseOptionValue = (evse: Pick<EvseDto, 'id' | 'evseTypeId'>): string =>
  JSON.stringify({ id: evse.id, evseTypeId: evse.evseTypeId });
