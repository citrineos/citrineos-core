/* eslint-disable */

const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.eslint.json'],
        tsconfigRootDir: __dirname,
      },
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
    },
  },
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
    ],
  },
);
