// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { fieldSet } from '@lib/queries/fields/field.set';

/** A variable's own scalar fields; also nested under variable-attribute queries. */
export const VARIABLE_FIELDS = fieldSet(['id', 'instance', 'name', 'createdAt', 'updatedAt']);
