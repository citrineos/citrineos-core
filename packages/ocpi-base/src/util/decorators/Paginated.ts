// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { QueryParams, UseBefore } from 'routing-controllers';
import { PaginatedMiddleware } from '../middleware/PaginatedMiddleware.js';

/**
 * Paginated decorator applies {@link PaginatedMiddleware} on the endpoint
 * @constructor
 */
export const Paginated = () =>
  function (object: NonNullable<unknown>, methodName: string, index: number) {
    QueryParams()(object, methodName, index);
    UseBefore(PaginatedMiddleware)(object, methodName);
  };
