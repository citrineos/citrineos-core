// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import eslint from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import pluginPrettier from 'eslint-plugin-prettier';
import tseslint from 'typescript-eslint';

export const sharedConfigs = [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      prettier: pluginPrettier,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-empty-object-type': 'off',
      'prettier/prettier': 'error',
    },
  },
  prettierConfig,
];

export const sharedIgnores = {
  ignores: [
    '**/dist/**',
    '**/node_modules/**',
    '**/lib/**',
    '**/coverage/**',
    'eslint.config.js',
    'eslint.config.mjs',
  ],
};
