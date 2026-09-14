// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import tseslint from 'typescript-eslint';
import { sharedConfigs, sharedIgnores } from '../../eslint.config.base.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default tseslint.config(
  ...sharedConfigs,
  {
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.eslint.json'],
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
  sharedIgnores,
);
