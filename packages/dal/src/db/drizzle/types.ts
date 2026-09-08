// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Forces every key of T to be explicitly present in the object literal,
 * even optional ones — the value can still be undefined, but it must be declared.
 *
 * Why: TypeScript silently allows optional keys to be omitted from object
 * literals that satisfy a type with `?` properties. This means a mapper that
 * adds a new optional field to a DTO will not break existing mapper
 * implementations — the field will simply be absent at runtime, which can cause
 * subtle bugs. Typing the intermediate result as `Explicit<T>` turns those
 * silent omissions into compile errors, forcing every developer to make a
 * conscious decision about each field (even if that decision is `field: undefined`).
 */
export type Explicit<T> = { [K in keyof Required<T>]: T[K] };
