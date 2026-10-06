// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

export function preMigrationRow<T extends object>(row: { [K in keyof T]: T[K] | null }): T {
  return row as T;
}
