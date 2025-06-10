/* eslint-disable */

const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const prettier = require('eslint-config-prettier');
const pluginPrettier = require('eslint-plugin-prettier');

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
      'Server/src/config/sequelize.bridge.config.js',
      '00_Base/json-schema-processor-1.6.js',
      '00_Base/json-schema-processor-2.0.1.js',
    ],
  },
  // Disable ESLint rules that conflict with Prettier
  prettier,
);
