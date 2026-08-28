// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { buildEvseOptionValue } from './evse.option.value';

describe('buildEvseOptionValue', () => {
  it('should encode the database id and the evseTypeId in that key order', () => {
    const value = buildEvseOptionValue({ id: 42, evseTypeId: 2 });

    expect(value).toBe('{"id":42,"evseTypeId":2}');
  });

  it('should give the same value for a full EVSE row as for the two keys alone', () => {
    const fromQuery = {
      id: 7,
      evseTypeId: 1,
      tenantId: 1,
      customData: { vendorId: 'acme' },
      connectors: [{ id: 11 }],
    } as unknown as Parameters<typeof buildEvseOptionValue>[0];

    expect(buildEvseOptionValue(fromQuery)).toBe(buildEvseOptionValue({ id: 7, evseTypeId: 1 }));
  });

  it('should give different values to different EVSEs on the same station', () => {
    const first = buildEvseOptionValue({ id: 10, evseTypeId: 1 });
    const second = buildEvseOptionValue({ id: 11, evseTypeId: 2 });

    expect(first).not.toBe(second);
  });

  it('should distinguish EVSEs that share an evseTypeId across stations', () => {
    const onOneStation = buildEvseOptionValue({ id: 10, evseTypeId: 1 });
    const onAnother = buildEvseOptionValue({ id: 99, evseTypeId: 1 });

    expect(onOneStation).not.toBe(onAnother);
  });

  it('should omit evseTypeId when the row does not carry one', () => {
    const value = buildEvseOptionValue({ id: 5, evseTypeId: undefined });

    expect(value).toBe('{"id":5}');
  });
});
