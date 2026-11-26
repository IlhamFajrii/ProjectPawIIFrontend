import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const FEATURES = ['ai', 'auth', 'chat', 'circles', 'disputes', 'landing', 'listings', 'orders', 'profile'];

export default tseslint.config(
  { ignores: ['dist', 'coverage'] },
  js.configs.recommended,
  tseslint.configs.strict,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['error', { allowConstantExport: true }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true, argsIgnorePattern: '^_' }],
      'no-console': ['error', { allow: ['error'] }],
      // Semua request lewat lib/api/client.ts.
      'no-restricted-globals': ['error', { name: 'fetch', message: 'Pakai api() dari lib/api/client.' }],
    },
  },
  { files: ['src/lib/api/client.ts'], rules: { 'no-restricted-globals': 'off' } },
  { files: ['**/*.test.{ts,tsx}', 'src/test/**'], rules: { 'react-refresh/only-export-components': 'off' } },
  // Fitur tidak saling mengimpor isi dalamnya.
  ...FEATURES.map((feature) => ({
    files: [`src/features/${feature}/**/*.{ts,tsx}`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: FEATURES.filter((other) => other !== feature).flatMap((other) => [
                `**/features/${other}/**`,
                `../../${other}/**`,
              ]),
              message: 'Pindahkan yang dipakai dua fitur ke components/ atau lib/.',
            },
          ],
        },
      ],
    },
  })),
);
