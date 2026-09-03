// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { fieldSet } from '@lib/queries/fields/field-set';

/** A tenant partner's own scalar fields (list + detail share the same selection). */
export const PARTNER_FIELDS = fieldSet(['id', 'countryCode', 'partyId', 'partnerProfileOCPI']);
