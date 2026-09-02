// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsDateOrDayjs } from '@lib/utils/is-date-or-dayjs';
import { Transform } from 'class-transformer';
import dayjs from 'dayjs';
import { isValid, parseISO } from 'date-fns';

export const IS_DATE = 'isDate';

export const TransformDate = () => {
  const toPlain = Transform(
    ({ value }) => {
      if (!value && !dayjs(value).isValid()) {
        console.warn('Invalid date passed to toPlain:', value);
        return value;
      }
      if (dayjs(value).isValid()) {
        return dayjs(value).toISOString();
      }
      return value;
    },
    {
      toPlainOnly: true,
    },
  );

  const toClass = Transform(
    ({ value }) => {
      if (value instanceof Date) {
        return value;
      }

      if (!value || typeof value !== 'string') {
        console.warn('Invalid date passed to toClass:', value);
        return value;
      }

      if (isValid(parseISO(value))) {
        return dayjs(value);
      }

      if (dayjs(value).isValid()) {
        return dayjs(value);
      }

      return value;
    },
    {
      toClassOnly: true,
    },
  );

  return function (target: any, key: string) {
    IsDateOrDayjs()(target, key);
    toPlain(target, key);
    toClass(target, key);

    Reflect.defineMetadata(IS_DATE, true, target, key);
  };
};
