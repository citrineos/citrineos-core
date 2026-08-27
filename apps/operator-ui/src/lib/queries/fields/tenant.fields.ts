// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { fieldSet } from '@lib/queries/fields/field.set';

/** A tenant's own scalar fields. */
export const TENANT_FIELDS = fieldSet(['id', 'name', 'tenantWebsocketServerPath']);
