// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from 'react';
import { Layout } from './components/layout';
import { createI18n, I18nContext } from './i18n';
import { Charging } from './pages/charging';
import { Checkout } from './pages/checkout';
import { Home } from './pages/home';
import { Receipt } from './pages/receipt';
import { matchRoute, usePathname } from './router';

export function App({ locale }: { locale: string }) {
  const i18n = useMemo(() => createI18n(locale), [locale]);
  const route = matchRoute(usePathname());
  return (
    <I18nContext.Provider value={i18n}>
      <Layout>
        {route.page === 'home' && <Home />}
        {route.page === 'checkout' && <Checkout key={route.evseId} evseId={route.evseId} />}
        {route.page === 'charging' && <Charging key={route.publicId} publicId={route.publicId} />}
        {route.page === 'receipt' && <Receipt key={route.publicId} publicId={route.publicId} />}
      </Layout>
    </I18nContext.Provider>
  );
}
