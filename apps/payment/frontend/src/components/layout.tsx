// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ReactNode } from 'react';
import { useI18n } from '../i18n';
import { followLink } from '../router';

export function Layout({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-primary px-4 py-3.5 text-primary-foreground print:hidden">
        <a
          href="/"
          onClick={followLink}
          className="inline-flex items-center gap-2 font-bold text-primary-foreground no-underline"
        >
          <BoltIcon />
          <span>{t('app.title')}</span>
        </a>
      </header>
      <main className="mx-auto flex w-full max-w-[560px] flex-col gap-4 p-4">{children}</main>
    </div>
  );
}

export function BoltIcon({ className = 'size-[22px]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" fill="currentColor" />
    </svg>
  );
}

/** A tick in a circle: something finished well. */
export function CircleCheckIcon({ className = 'size-[22px]' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      data-icon="circle-check"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m8 12 3 3 5-6" />
    </svg>
  );
}

/** A cross in a circle: something stopped or went wrong. */
export function CircleXIcon({ className = 'size-[22px]' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      data-icon="circle-x"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6M9 9l6 6" />
    </svg>
  );
}

export function Spinner() {
  return (
    <div
      className="mx-auto my-2 size-7 animate-spin rounded-full border-3 border-border border-t-primary motion-reduce:animate-none"
      role="progressbar"
      aria-busy="true"
    />
  );
}

export function Notice({ tone, children }: { tone: 'info' | 'error'; children: ReactNode }) {
  return (
    <p
      className={`rounded-lg bg-muted px-3 py-2.5 ${tone === 'error' ? 'text-destructive' : ''}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      {children}
    </p>
  );
}
