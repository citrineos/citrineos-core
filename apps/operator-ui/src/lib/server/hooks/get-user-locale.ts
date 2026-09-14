// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use server';

import { DEFAULT_LOCALE, I18N_COOKIE_NAME } from '@lib/utils/consts';
import { cookies } from 'next/headers';

export async function getUserLocale() {
  return (await cookies()).get(I18N_COOKIE_NAME)?.value || DEFAULT_LOCALE;
}

export async function setUserLocale(locale: string) {
  (await cookies()).set(I18N_COOKIE_NAME, locale);
}
