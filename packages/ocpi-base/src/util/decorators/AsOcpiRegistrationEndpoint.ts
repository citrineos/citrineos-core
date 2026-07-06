// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ParamOptions } from 'routing-controllers';
import { HeaderParam, UseBefore } from 'routing-controllers';
import { AuthMiddleware } from '../middleware/AuthMiddleware.js';
import { UniqueMessageIdsMiddleware } from '../middleware/UniqueMessageIdsMiddleware.js';
import { HttpHeader } from '@citrineos/base';
import { uniqueMessageIdHeaders } from './AsOcpiFunctionalEndpoint.js';
import { OcpiExceptionHandler } from '../middleware/OcpiExceptionHandler.js';

/**
 * Decorator for to inject OCPI headers and apply {@link AuthMiddleware} and {@link UniqueMessageIdsMiddleware}
 * on the endpoint
 */
export const AsOcpiRegistrationEndpoint = function () {
  const headers: { [key: string]: ParamOptions } = {
    [HttpHeader.Authorization]: { required: true },
    ...uniqueMessageIdHeaders,
  };
  return function (object: any, methodName: string) {
    for (const [key, options] of Object.entries(headers)) {
      HeaderParam(key, options)(object, methodName);
    }
    UseBefore(AuthMiddleware)(object, methodName);
    UseBefore(UniqueMessageIdsMiddleware)(object, methodName);
    UseBefore(OcpiExceptionHandler)(object, methodName);
  };
};
