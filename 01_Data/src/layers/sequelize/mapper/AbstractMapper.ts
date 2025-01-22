// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { validateSync } from 'class-validator';

export abstract class AbstractMapper<T> {
  abstract toModel(): T;

  protected validate(): void {
    const errors = validateSync(this, { validationError: { target: false } });
    if (errors.length > 0) {
      throw new Error('Validation failed: ' + JSON.stringify(errors));
    }
  }
}
