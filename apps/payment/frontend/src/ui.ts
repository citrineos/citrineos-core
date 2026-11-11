// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// Tailwind classes the pages share. The colours are the operator UI's theme tokens, defined in
// styles.css, which switch with the system's dark mode.

const buttonBase =
  'inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-1.5 rounded-md ' +
  'border px-4 py-2.5 font-semibold no-underline disabled:cursor-not-allowed disabled:opacity-50';

export const ui = {
  card: 'space-y-3 rounded-xl border border-border bg-card p-4 text-card-foreground',
  title: 'text-[1.35rem] font-bold leading-snug',
  heading: 'text-[1.05rem] font-semibold',
  muted: 'text-muted-foreground',
  small: 'text-sm',
  /** A grid of <dt>/<dd> pairs, the term muted beside its value. */
  details: 'grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1.5 [&>dt]:text-muted-foreground',
  mono: 'font-mono text-[0.8rem] break-words',
  primaryButton: `${buttonBase} border-primary bg-primary text-primary-foreground hover:bg-primary/90`,
  button: `${buttonBase} border-input bg-background text-foreground hover:bg-accent`,
};
