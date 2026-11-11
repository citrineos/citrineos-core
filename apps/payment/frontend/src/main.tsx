// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app';
import { pickLocale } from './i18n';
import './styles.css';

const locale = pickLocale(navigator.languages);
document.documentElement.lang = locale;

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App locale={locale} />
    </StrictMode>,
  );
}
