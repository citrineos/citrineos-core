// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterEach, vi } from 'vitest';
import { cleanup } from './render';

// Tells React that updates in tests are wrapped in act().
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
// jsdom has no layout to scroll.
window.scrollTo = () => undefined;

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  window.history.replaceState(null, '', '/');
});
