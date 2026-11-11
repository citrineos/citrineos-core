// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ReactNode } from 'react';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { createI18n, I18nContext } from '../src/i18n';

const mounted: { root: Root; container: HTMLElement }[] = [];

/** Renders into the document, in the given language, and settles React's work. */
export async function render(ui: ReactNode, locale = 'en'): Promise<HTMLElement> {
  const container = document.body.appendChild(document.createElement('div'));
  const root = createRoot(container);
  mounted.push({ root, container });
  await act(async () => {
    root.render(<I18nContext.Provider value={createI18n(locale)}>{ui}</I18nContext.Provider>);
  });
  return container;
}

export function cleanup(): void {
  for (const { root, container } of mounted.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
}

/** Lets pending promises, and the renders they cause, finish. */
export async function settle(): Promise<void> {
  for (let i = 0; i < 5; i++) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

export function text(container: HTMLElement): string {
  return container.textContent ?? '';
}

export function button(container: HTMLElement, label: string): HTMLButtonElement {
  const found = [...container.querySelectorAll('button')].find((candidate) =>
    candidate.textContent?.includes(label),
  );
  if (!found) {
    throw new Error(`No button "${label}" in: ${text(container)}`);
  }
  return found;
}

export function link(container: HTMLElement, label: string): HTMLAnchorElement {
  const found = [...container.querySelectorAll('a')].find((candidate) =>
    candidate.textContent?.includes(label),
  );
  if (!found) {
    throw new Error(`No link "${label}" in: ${text(container)}`);
  }
  return found;
}

export async function click(element: HTMLElement): Promise<void> {
  await act(async () => {
    element.click();
  });
  await settle();
}

/** Types into an input as React sees it: through the native value setter and an input event. */
export async function type(input: HTMLInputElement, value: string): Promise<void> {
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    setter?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

export interface FakeResponse {
  status?: number;
  body: unknown;
}

/** Answers fetch from a table of `METHOD path` to responses, and records the requests. */
export function fakeApi(routes: Record<string, FakeResponse | (() => FakeResponse)>) {
  const requests: { method: string; path: string; body: unknown }[] = [];
  const fetchFn = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const method = init?.method ?? 'GET';
    const path = String(input);
    requests.push({
      method,
      path,
      body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
    });
    const route = routes[`${method} ${path}`];
    if (!route) {
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    }
    const { status = 200, body } = typeof route === 'function' ? route() : route;
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  return { fetchFn, requests };
}
