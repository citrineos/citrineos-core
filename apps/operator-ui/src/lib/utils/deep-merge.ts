// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

type Messages = { [key: string]: unknown };

const isMessages = (value: unknown): value is Messages =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Overlays `override` on `base` key by key, at every depth, so a partial section keeps the rest. */
export const deepMerge = (base: Messages, override: Messages): Messages => {
  const merged: Messages = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const current = merged[key];
    merged[key] = isMessages(current) && isMessages(value) ? deepMerge(current, value) : value;
  }
  return merged;
};
