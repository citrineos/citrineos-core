// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use server';

import { authedAction, type ActionResult } from '@lib/utils/action-guard';
import config from '@lib/utils/config';

export async function getGoogleMapsApiKeyAction(): Promise<ActionResult<string>> {
  return authedAction<string>(async (_session) => {
    return config.googleMapsApiKey || '';
  });
}
