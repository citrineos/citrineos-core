// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
export function splitOnce(value: string, separator: string): [string, string?] {
  const idx = value.indexOf(separator);
  return idx == -1 ? [value] : [value.substring(0, idx), value.substring(idx + separator.length)];
}
