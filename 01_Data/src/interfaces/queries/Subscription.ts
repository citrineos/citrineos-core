// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { QuerySchema } from '@citrineos/base';

export const CreateSubscriptionSchema = QuerySchema('CreateSubscriptionSchema', [
  {
    key: 'stationId',
    type: 'string',
    required: true,
  },
  {
    key: 'url',
    type: 'string',
    required: true,
  },
  {
    key: 'messageRegexFilter',
    type: 'string',
  },
  {
    key: 'onClose',
    type: 'boolean',
  },
  {
    key: 'onConnect',
    type: 'boolean',
  },
  {
    key: 'onMessage',
    type: 'boolean',
  },
  {
    key: 'sentMessage',
    type: 'boolean',
  },
]);
