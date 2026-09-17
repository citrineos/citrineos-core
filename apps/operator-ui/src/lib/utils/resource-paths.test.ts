// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { chargingStationEditPath, chargingStationPath, encodeSegment } from './resource-paths';

describe('chargingStationPath', () => {
  it('builds a detail path from a simple name', () => {
    expect(chargingStationPath('CS-001')).toBe('/charging-stations/CS-001');
  });

  it.each([
    ['a space', 'CS 001', '/charging-stations/CS%20001'],
    ['a percent', '100%', '/charging-stations/100%25'],
    ['a hash', 'CS#1', '/charging-stations/CS%231'],
    ['a plus', 'CS+1', '/charging-stations/CS%2B1'],
    ['a slash', 'a/b', '/charging-stations/a%2Fb'],
    ['a question mark', 'CS?1', '/charging-stations/CS%3F1'],
    ['unicode', 'Ladestation-Ä', '/charging-stations/Ladestation-%C3%84'],
  ])('percent-encodes %s', (_label, name, expected) => {
    expect(chargingStationPath(name)).toBe(expected);
  });

  it('round-trips the encoded segment back to the original name', () => {
    const names = ['CS 001', '100%', 'CS#1', 'CS+1', 'a/b', 'Ladestation-Ä', 'cs-001'];
    for (const name of names) {
      const segment = chargingStationPath(name).replace('/charging-stations/', '');
      expect(decodeURIComponent(segment)).toBe(name);
    }
  });

  it('preserves case so two names differing only in case stay distinct', () => {
    expect(chargingStationPath('CS-1')).not.toBe(chargingStationPath('cs-1'));
  });
});

describe('chargingStationEditPath', () => {
  it('builds an edit path with the same encoding', () => {
    expect(chargingStationEditPath('CS 001')).toBe('/charging-stations/CS%20001/edit');
  });
});

describe('encodeSegment', () => {
  it('leaves URL-safe names untouched', () => {
    expect(encodeSegment('cs-001_A.b~c')).toBe('cs-001_A.b~c');
  });
});
