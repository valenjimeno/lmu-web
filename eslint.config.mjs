import { defineConfig, globalIgnores } from 'eslint/config';
import tsEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': tsEslint,
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  prettier,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'coverage/**', 'next-env.d.ts']),
]);

export default eslintConfig;
