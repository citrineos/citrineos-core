// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { MouseEvent } from 'react';
import { useSyncExternalStore } from 'react';

export type Route =
  | { page: 'home' }
  | { page: 'checkout'; evseId: number }
  | { page: 'charging'; publicId: string }
  | { page: 'receipt'; publicId: string };

/** The same pages the payment server serves the app for. */
export function matchRoute(pathname: string): Route {
  const [first, second, ...rest] = pathname.split('/').filter(Boolean);
  if (first === undefined) {
    return { page: 'home' };
  }
  if (second !== undefined && rest.length === 0) {
    const id = decodeURIComponent(second);
    if (first === 'checkout' && /^\d{1,9}$/.test(id)) {
      return { page: 'checkout', evseId: Number(id) };
    }
    if (first === 'charging') {
      return { page: 'charging', publicId: id };
    }
    if (first === 'receipt') {
      return { page: 'receipt', publicId: id };
    }
  }
  return { page: 'home' };
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener('popstate', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('popstate', listener);
  };
}

export function navigate(path: string): void {
  window.history.pushState(null, '', path);
  listeners.forEach((listener) => listener());
  window.scrollTo?.(0, 0);
}

export function usePathname(): string {
  return useSyncExternalStore(subscribe, () => window.location.pathname);
}

/** For an <a href> that navigates within the app instead of reloading it. */
export function followLink(event: MouseEvent<HTMLAnchorElement>): void {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }
  event.preventDefault();
  navigate(event.currentTarget.getAttribute('href') ?? '/');
}
