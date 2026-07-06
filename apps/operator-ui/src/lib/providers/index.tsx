// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { ThemeProvider } from '@ferdiunal/refine-shadcn';
import { Toaster } from '@lib/client/components/ui/sonner';
import { createAccessProvider } from '@lib/providers/access-control-provider';
import { authProvider } from '@lib/providers/auth-provider';
import dataProvider from '@lib/providers/data-provider';
import liveProvider from '@lib/providers/live-provider';
import { createNotificationProvider } from '@lib/providers/notification-provider';
import ReduxProvider from '@lib/providers/redux-provider';
import { setUserLocale } from '@lib/server/hooks/getUserLocale';
import { resources } from '@lib/utils/resources';
import type { I18nProvider } from '@refinedev/core';
import { Refine } from '@refinedev/core';
import routerProvider from '@refinedev/nextjs-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';
import React, { useEffect, useMemo, useState } from 'react';

export function Providers({
  children,
  defaultMode = 'light',
}: {
  children: React.ReactNode;
  defaultMode?: 'light' | 'dark';
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const accessControlProvider = useMemo(
    () =>
      createAccessProvider({
        getPermissions: authProvider.getPermissions!,
        getUserRole: authProvider.getUserRole!,
      }),
    [],
  );

  const queryClient: QueryClient = useMemo(() => {
    return new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: Infinity,
          refetchOnWindowFocus: false,
        },
      },
    });
  }, []);

  const t = useTranslations();

  const i18nProvider: I18nProvider = {
    translate: (key: string, options: any) => t(key, options),
    getLocale: useLocale,
    changeLocale: setUserLocale,
  };

  const notificationProvider = useMemo(
    () => createNotificationProvider((key, options) => t(key, options)),
    [t],
  );

  if (!mounted) return null;

  return (
    <SessionProvider>
      <ReduxProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider
            attribute="data-theme"
            defaultTheme={defaultMode}
            enableSystem={false}
            storageKey="theme"
            disableTransitionOnChange
          >
            <Toaster />
            {/* <DevtoolsProvider>
              <Suspense fallback={<div>Loading...</div>}> */}
            <Refine
              routerProvider={routerProvider}
              dataProvider={dataProvider}
              liveProvider={liveProvider}
              notificationProvider={notificationProvider}
              authProvider={authProvider}
              accessControlProvider={accessControlProvider}
              i18nProvider={i18nProvider}
              resources={resources}
              options={{
                warnWhenUnsavedChanges: true,
                projectId: '6ZV3T4-Lyy7B3-Dr5Uhd',
                liveMode: 'auto',
                reactQuery: {
                  clientConfig: queryClient,
                },
              }}
            >
              {children}
            </Refine>
            {/* </Suspense>
            </DevtoolsProvider> */}
          </ThemeProvider>
        </QueryClientProvider>
      </ReduxProvider>
    </SessionProvider>
  );
}
