// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { fieldSet } from '@lib/queries/fields/field.set';

/** A change-configuration's shared scalar fields; the list query also adds `readonly` inline. */
export const CHANGE_CONFIGURATION_FIELDS = fieldSet(['ocppConnectionName', 'key', 'value']);
