// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// The OidcTokenProvider now lives in @citrineos/base so that base-level modules
// (e.g. AbstractModule message API callbacks) can authenticate callbacks as well.
// Re-exported here to preserve existing import paths.
export { OidcTokenProvider } from '@citrineos/base';
export type { OidcTokenProviderConfig } from '@citrineos/base';
