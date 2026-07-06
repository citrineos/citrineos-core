// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { CrudFilter } from '@refinedev/core';
import { ResourceType } from '@lib/utils/access.types';

export const I18N_COOKIE_NAME = 'NEXT_LOCALE';
export const DEFAULT_LOCALE = 'en';

export const LOCALES = [
  { value: 'en', label: 'English' },
  { value: 'pt-BR', label: 'Português (Brasil)' },
];

export const NEW_IDENTIFIER = 'new';

export const EMPTY_FILTER: CrudFilter[] = [
  {
    operator: 'or',
    value: [],
  },
];

export const DEFAULT_SORTERS: any = {
  initial: [
    {
      field: 'updatedAt',
      order: 'desc',
    },
  ],
};

export const DEFAULT_EXPANDED_DATA_FILTER = (field: string, operator: string, value: any) => {
  return {
    permanent: [
      {
        field,
        operator,
        value,
      },
    ],
  };
};

export const NOT_APPLICABLE = 'N/A';
export const EMPTY_VALUE = '-';
export const DEFAULT_TABLE_STATE = 'table';
export const DETAIL_TAB_STATE = 'tab';

// S3 bucket folder name
export const S3_BUCKET_FOLDER_IMAGES_LOCATIONS = `images/${ResourceType.LOCATIONS}`;
export const S3_BUCKET_FOLDER_IMAGES_CHARGING_STATIONS = `images/${ResourceType.CHARGING_STATIONS}`;
export const S3_BUCKET_FILE_CORE_CONFIG = 'config.json';
export const S3_BUCKET_FILE_CONFIG = 'operator.config.json';
