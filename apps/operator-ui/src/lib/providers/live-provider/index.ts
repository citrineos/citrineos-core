// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { authProvider } from '@lib/providers/auth-provider';
import config from '@lib/utils/config';
import { HasuraHeader } from '@lib/utils/hasura.types';
import {
  graphqlWS,
  type HasuraLiveProviderOptions,
  liveProvider as liveProviderHasura,
} from '@refinedev/hasura';

const WS_URL = config.wsUrl;

const webSocketClient = graphqlWS.createClient({
  url: WS_URL,
  connectionParams: async () => {
    const token = await authProvider.getToken();
    if (token) {
      const hasuraHeaders = await authProvider.getHasuraHeaders();
      if (hasuraHeaders) {
        const hasuraRole = hasuraHeaders.get(HasuraHeader.X_HASURA_ROLE);
        if (hasuraRole)
          // If a role is set, include it in the connection params
          return {
            headers: {
              Authorization: `Bearer ${token}`,
              [HasuraHeader.X_HASURA_ROLE]: hasuraRole,
            },
          };
      }
      return {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
    }
  },
});

const hasuraProviderOptions = {
  idType: 'Int',
  namingConvention: 'hasura-default',
};

const liveProvider = liveProviderHasura(
  webSocketClient,
  hasuraProviderOptions as HasuraLiveProviderOptions,
);

export default liveProvider;
