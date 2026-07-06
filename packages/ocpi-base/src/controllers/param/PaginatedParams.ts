// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsDateString, IsInt, Min } from 'class-validator';
import { Optional } from '../../util/decorators/Optional.js';
import { DEFAULT_LIMIT, DEFAULT_OFFSET } from '../../model/PaginatedResponse.js';

export class PaginatedParams {
  @IsInt()
  @Min(0)
  @Optional()
  offset?: number = DEFAULT_OFFSET;

  @IsInt()
  @Min(1)
  @Optional()
  limit?: number = DEFAULT_LIMIT;

  @IsDateString()
  @Optional()
  private date_from?: string;

  @IsDateString()
  @Optional()
  private date_to?: string;

  get dateFrom(): Date | undefined {
    if (this.date_from) {
      return new Date(this.date_from);
    } else {
      return undefined;
    }
  }

  get dateTo(): Date | undefined {
    if (this.date_to) {
      return new Date(this.date_to);
    } else {
      return undefined;
    }
  }

  set dateFrom(value: Date | undefined) {
    if (value) {
      this.date_from = value.toISOString();
    }
  }

  set dateTo(value: Date | undefined) {
    if (value) {
      this.date_to = value.toISOString();
    }
  }
}
