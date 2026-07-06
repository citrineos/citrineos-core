// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ParamOptions } from 'routing-controllers';
import { HeaderParam, UseBefore } from 'routing-controllers';
import { AuthMiddleware } from '../middleware/AuthMiddleware.js';
import { OcpiHttpHeader } from '../OcpiHttpHeader.js';
import { OcpiHeaderMiddleware } from '../middleware/OcpiHeaderMiddleware.js';
import { UniqueMessageIdsMiddleware } from '../middleware/UniqueMessageIdsMiddleware.js';
import { HttpHeader } from '@citrineos/base';
import { OcpiExceptionHandler } from '../middleware/OcpiExceptionHandler.js';

export const uniqueMessageIdHeaders = {
  [OcpiHttpHeader.XRequestId]: { required: true },
  [OcpiHttpHeader.XCorrelationId]: { required: true },
};

/**
 * Decorator for to inject OCPI headers and apply {@link AuthMiddleware}, {@link OcpiHeaderMiddleware} and
 * {@link UniqueMessageIdsMiddleware} on the endpoint
 */
export const AsOcpiFunctionalEndpoint = function () {
  const headers: { [key: string]: ParamOptions } = {
    [HttpHeader.Authorization]: { required: true },
    [OcpiHttpHeader.OcpiFromCountryCode]: { required: true },
    [OcpiHttpHeader.OcpiFromPartyId]: { required: true },
    [OcpiHttpHeader.OcpiToCountryCode]: { required: true },
    [OcpiHttpHeader.OcpiToPartyId]: { required: true },
    ...uniqueMessageIdHeaders,
  };
  return function (object: any, methodName: string) {
    for (const [key, options] of Object.entries(headers)) {
      HeaderParam(key, options)(object, methodName);
    }
    UseBefore(AuthMiddleware)(object, methodName);
    UseBefore(OcpiHeaderMiddleware)(object, methodName);
    UseBefore(UniqueMessageIdsMiddleware)(object, methodName);
    UseBefore(OcpiExceptionHandler)(object, methodName);
  };
};
