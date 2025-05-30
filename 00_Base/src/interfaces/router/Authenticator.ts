// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { IncomingMessage } from 'http';
import { AuthenticationOptions } from './AuthenticationOptions';

export interface IAuthenticator {
  authenticate(
    request: IncomingMessage,
    tenantId: number,
    options: AuthenticationOptions,
  ): Promise<{ identifier: string }>;
}
