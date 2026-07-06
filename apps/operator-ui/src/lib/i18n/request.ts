// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use server';

import { getUserLocale } from '@lib/server/hooks/getUserLocale';
import { getRequestConfig } from 'next-intl/server';

const fallbackLocale = 'en';
const messageFilenames = [
  'common',
  'chargingStations',
  'locations',
  'authorizations',
  'tariffs',
  'transactions',
  'tenantPartners',
  'overview',
];

export default getRequestConfig(async () => {
  const locale = (await getUserLocale()) ?? fallbackLocale;

  const messages = await messageFilenames.reduce(async (allMessagesPromise, currentFile) => {
    let currentMessages = [];
    try {
      currentMessages = (await import(`../../../public/locales/${locale}/${currentFile}.json`))
        .default;
    } catch (e) {
      console.debug(`No messages found for ${currentFile}, skipping...`);
    }

    const allMessages = await allMessagesPromise;

    return { ...allMessages, ...currentMessages };
  }, {} as any);

  const fallbackMessages = await messageFilenames.reduce(
    async (allFallbacksPromise, currentFile) => {
      let currentFallbacks = [];
      try {
        currentFallbacks = (
          await import(`../../../public/locales/${fallbackLocale}/${currentFile}.json`)
        ).default;
      } catch (e) {
        console.debug(`No fallback messages found for ${currentFile}, skipping...`);
      }

      const allFallbacks = await allFallbacksPromise;

      return { ...allFallbacks, ...currentFallbacks };
    },
    {} as any,
  );

  return {
    locale,
    messages: { ...fallbackMessages, ...messages },
  };
});
