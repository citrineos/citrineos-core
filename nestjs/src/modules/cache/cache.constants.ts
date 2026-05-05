// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Cache key namespaces — mirrored from legacy `@citrineos/base` `CacheNamespace`.
 * Each namespace is composed onto the cache key via `${namespace}:${key}`.
 */
export const CacheNamespace = {
  /** Per-station boot status cached when not Accepted. */
  BootStatus: 'BOOT_STATUS',

  /** Per-station action blacklists ("blacklisted" / "ongoing" / "complete"). */
  Transactions: 'transactions',

  /** Per-tenant station connection metadata (allowUnknownChargingStations, etc.). */
  Connections: 'connections',
} as const;

/** Direct key under Connection namespace, used in legacy code as `BOOT_STATUS`. */
export const BOOT_STATUS = CacheNamespace.BootStatus;
