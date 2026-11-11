// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { matchRoute } from '../src/router';

describe('matchRoute', () => {
  it.each([
    ['/', { page: 'home' }],
    ['/checkout/7', { page: 'checkout', evseId: 7 }],
    ['/checkout/7/', { page: 'checkout', evseId: 7 }],
    ['/charging/abc', { page: 'charging', publicId: 'abc' }],
    ['/receipt/abc', { page: 'receipt', publicId: 'abc' }],
    ['/checkout', { page: 'home' }],
    ['/charging/a/b', { page: 'home' }],
    ['/elsewhere', { page: 'home' }],
  ])('reads %s', (pathname, route) => {
    expect(matchRoute(pathname)).toEqual(route);
  });
});
