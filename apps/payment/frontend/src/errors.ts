// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { ApiError } from './api';
import type { MessageKey } from './i18n';

/** The message for a failed request: what the page says for a status, else a generic one. */
export function errorMessage(
  error: unknown,
  byStatus: Partial<Record<number, MessageKey>> = {},
): MessageKey {
  if (error instanceof ApiError) {
    return byStatus[error.status] ?? 'error.generic';
  }
  return error instanceof TypeError ? 'error.network' : 'error.generic';
}
