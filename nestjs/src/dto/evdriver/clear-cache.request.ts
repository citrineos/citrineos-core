// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * OCPP 2.0.1 / 2.1 ClearCache request.
 *
 * The wire payload is `{}` — no fields. We declare an empty class anyway so
 * controllers can use the same `@Body() body: ClearCacheRequest` pattern as
 * every other action and class-validator's `forbidNonWhitelisted` rejects
 * unexpected fields.
 */
export class ClearCacheRequest {}
