/* eslint-disable */

const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
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
      '@typescript-eslint/no-empty-object-type': 'off'
    },
  },
  {
    ignores: [
      '**/DirectusExtensions/**',
      '**/Swarm/**',
      '**/dist/**',
      '**/node_modules/**',
      '**/lib/**',
    ],
  },
);
