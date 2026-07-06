// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { toast } from 'sonner';

/**
 * Subset of refine's TranslateFunction. Optional so this utility keeps working
 * (with an English fallback) when called outside of a React component/hook.
 */
type TranslateFn = (key: string, options?: any, defaultMessage?: string) => string;

export const copy = async (
  value: string | null | undefined,
  displayValue = true,
  translate?: TranslateFn,
) => {
  if (!value) return;

  await navigator.clipboard.writeText(value);

  let message: string;
  if (translate) {
    message = displayValue
      ? translate('Common.copiedValueToClipboard', { value })
      : translate('Common.copiedToClipboard');
  } else {
    message = `Copied${displayValue ? ` ${value}` : ''} to clipboard.`;
  }

  toast.message(message);
};
