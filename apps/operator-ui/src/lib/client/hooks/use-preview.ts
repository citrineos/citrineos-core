// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { parseAsString, useQueryState } from 'nuqs';

/** URL query key holding the previewed station's ocppConnectionName. */
export const PREVIEW_QUERY_KEY = 'preview';

/**
 * usePreview stores which station's preview panel is open in the `?preview=<ocppConnectionName>`
 * URL param (via nuqs), the same way `useTableFilters` stores table filters in the URL. Because the
 * state lives in the URL, the panel survives reloads and the current URL is directly shareable — and
 * it clears itself when navigating to a route that doesn't carry the param.
 *
 * Returns:
 * - `preview`      – the ocppConnectionName currently previewed, or null when the panel is closed
 * - `openPreview`  – open the preview for a station by its ocppConnectionName
 * - `closePreview` – close the preview (removes the param)
 */
export const usePreview = () => {
  const [preview, setPreview] = useQueryState(PREVIEW_QUERY_KEY, parseAsString);

  return {
    preview,
    openPreview: (ocppConnectionName: string) => setPreview(ocppConnectionName),
    closePreview: () => setPreview(null),
  };
};
