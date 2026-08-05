// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';
import { joinRoutePath } from '../../../src/util/endpoints/paths.js';

describe('joinRoutePath', () => {
  it.each([
    { name: 'bare segments', segments: ['commands', 'setStationPassword'] },
    { name: 'leading slashes', segments: ['/commands', '/setStationPassword'] },
    { name: 'trailing slashes', segments: ['commands/', 'setStationPassword/'] },
    { name: 'both', segments: ['/commands/', '/setStationPassword/'] },
    { name: 'doubled slashes', segments: ['//commands//', '//setStationPassword'] },
  ])('normalizes $name to a single absolute path', ({ segments }) => {
    expect(joinRoutePath(...segments)).toBe('/commands/setStationPassword');
  });

  it('drops empty segments instead of collapsing them into a doubled separator', () => {
    expect(joinRoutePath('ocpp', '2.0.1', '', 'certificateSigned')).toBe(
      '/ocpp/2.0.1/certificateSigned',
    );
  });

  it('drops slash-only segments', () => {
    expect(joinRoutePath('ocpp', '2.0.1', '/', 'certificateSigned')).toBe(
      '/ocpp/2.0.1/certificateSigned',
    );
  });

  it('never emits a doubled slash for any combination of empty and slashed segments', () => {
    const variants = ['', '/', '//', 'certificates', '/certificates', 'certificates/'];
    for (const prefix of variants) {
      const path = joinRoutePath('ocpp', '2.0.1', prefix, 'certificateSigned');
      expect(path).not.toContain('//');
      expect(path.startsWith('/')).toBe(true);
    }
  });

  it('returns a root path when every segment is empty', () => {
    expect(joinRoutePath('', '/')).toBe('/');
  });

  it('preserves interior segments of a multi-part path', () => {
    expect(joinRoutePath('/evdriver', '/webpayment/initiate')).toBe(
      '/evdriver/webpayment/initiate',
    );
  });
});
