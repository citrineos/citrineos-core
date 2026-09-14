// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { fieldSet } from '@lib/queries/fields/field-set';

/** Core fields common to most Evse selections. */
export const EVSE_CORE_FIELDS = fieldSet(['id', 'evseTypeId', 'evseId', 'createdAt', 'updatedAt']);

/** Detail fields added on top of {@link EVSE_CORE_FIELDS} on the station/EVSE pages. */
export const EVSE_DETAIL_FIELDS = fieldSet(['ocppConnectionName', 'physicalReference', 'removed']);
