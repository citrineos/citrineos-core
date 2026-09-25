// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import type { ParseResponse, RouterProvider } from '@refinedev/core';
import nextRouterProvider from '@refinedev/nextjs-router';
import { PREVIEW_QUERY_KEY } from '@lib/client/hooks/use-preview';

const omitUiQueryParams = (parsed: ParseResponse): ParseResponse => {
  if (!parsed.params) return parsed;
  const { [PREVIEW_QUERY_KEY]: _preview, ...params } = parsed.params;
  return { ...parsed, params };
};

export const routerProvider: RouterProvider = {
  ...nextRouterProvider,
  parse: () => {
    const parse = nextRouterProvider.parse!();
    return () => omitUiQueryParams(parse());
  },
};
