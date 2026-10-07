// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';
import { formErrorMessages } from './form-errors';

describe('formErrorMessages', () => {
  it('lists the message of each field error', () => {
    expect(
      formErrorMessages({
        address: { type: 'too_small', message: 'Street address is required' },
        name: { type: 'required', message: 'Name is required' },
      }),
    ).toEqual(['Street address is required', 'Name is required']);
  });

  it('reads nested fields, arrays and a field named type', () => {
    expect(
      formErrorMessages({
        additionalInfo: [{ type: { type: 'too_small', message: 'Type is required' } }],
        coordinates: { latitude: { type: 'invalid', message: 'Latitude is invalid' } },
      }),
    ).toEqual(['Type is required', 'Latitude is invalid']);
  });

  it('skips errors without a message and does not descend into them', () => {
    const ref = { parentElement: { self: null as unknown } };
    ref.parentElement.self = ref;
    expect(formErrorMessages({ city: { type: 'custom', ref } })).toEqual([]);
  });

  it('lists a repeated message once', () => {
    expect(
      formErrorMessages({
        a: { type: 'x', message: 'Required' },
        b: { type: 'x', message: 'Required' },
      }),
    ).toEqual(['Required']);
  });
});
