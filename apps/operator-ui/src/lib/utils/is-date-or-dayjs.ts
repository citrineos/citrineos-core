// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ValidationOptions } from 'class-validator';
import { buildMessage, ValidateBy } from 'class-validator';
import { Dayjs, isDayjs } from 'dayjs';

export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

export function isDateOrDayjs(value: unknown): value is Dayjs | Date {
  return isDate(value) || isDayjs(value);
}

export function IsDateOrDayjs(validationOptions?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isDateOrDayjs',
      validator: {
        validate: (value, _args): boolean => isDateOrDayjs(value),
        defaultMessage: buildMessage(
          (eachPrefix) => eachPrefix + '$property must be a Date or Dayjs instance',
          validationOptions,
        ),
      },
    },
    validationOptions,
  );
}
