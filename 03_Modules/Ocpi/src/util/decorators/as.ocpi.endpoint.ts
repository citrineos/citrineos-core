// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { HeaderParam, UseBefore } from 'routing-controllers';
import { ParamOptions } from 'routing-controllers/types/decorator-options/ParamOptions';
import { AuthMiddleware } from '../middleware/auth.middleware';

function applyHeaders(headers: { [key: string]: ParamOptions }) {
  return function (object: any, methodName: string) {
    for (const [key, options] of Object.entries(headers)) {
      HeaderParam(key, options)(object, methodName);
    }
    UseBefore(AuthMiddleware)(object, methodName);
  };
}

/**
 * Decorator for to inject OCPI headers
 *
 */
export const AsOcpiEndpoint = function () {
  const headers: { [key: string]: ParamOptions } = {
    authorization: { required: true },
    'X-Request-ID': { required: true },
    'X-Correlation-ID': { required: true },
    'OCPI-from-country-code': { required: true },
    'OCPI-from-party-id': { required: true },
    'OCPI-to-country-code': { required: true },
    'OCPI-to-party-id': { required: true },
  };
  return applyHeaders(headers);
};
