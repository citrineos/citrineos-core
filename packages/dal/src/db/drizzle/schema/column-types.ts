// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { customType } from 'drizzle-orm/pg-core';

/**
 * PostgreSQL `citext` — case-insensitive text, provided by the `citext` extension.
 * drizzle-orm has no built-in citext column type, so it is declared here as a custom
 * type.
 */
export const citext = customType<{ data: string; driverData: string }>({
  dataType: () => 'citext',
});
