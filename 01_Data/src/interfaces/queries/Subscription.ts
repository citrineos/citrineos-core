// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { QuerySchema } from '@citrineos/base';

export const CreateSubscriptionSchema = QuerySchema(
  'CreateSubscriptionSchema',
  [
    ['stationId', 'string'],
    ['onConnect', 'boolean'],
    ['onClose', 'boolean'],
    ['onMessage', 'boolean'],
    ['sentMessage', 'boolean'],
    ['messageRegexFilter', 'string'],
    ['url', 'string'],
  ],
  ['url', 'stationId'],
);
