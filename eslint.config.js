// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable */

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import pluginPrettier from 'eslint-plugin-prettier';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.eslint.json'],
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      prettier: pluginPrettier,
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
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
  // Ignore patterns
  {
    ignores: [
      '**/DirectusExtensions/**',
      '**/Swarm/**',
      '**/dist/**',
      '**/node_modules/**',
      '**/lib/**',
      'eslint.config.js',
      'Server/directus-env-config.cjs',
      '00_Base/json-schema-processor-1.6.js',
      '00_Base/json-schema-processor-2.0.1.js',
      'coverage',
    ],
  },
  // Disable ESLint rules that conflict with Prettier
  prettier,
);
