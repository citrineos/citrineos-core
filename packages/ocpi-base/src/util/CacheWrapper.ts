// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ICache } from '@citrineos/base';

export class CacheWrapper {
  cache: ICache;

  constructor(cache: ICache) {
    this.cache = cache;
  }
}
