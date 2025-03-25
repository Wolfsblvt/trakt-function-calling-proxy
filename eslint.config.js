import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';
import * as importPlugin from 'eslint-plugin-import';
import nodePlugin from 'eslint-plugin-n';
import globals from 'globals';

export default defineConfig([
    eslint.configs.recommended,
    tseslint.configs.strictTypeChecked,
    tseslint.configs.stylisticTypeChecked,
    importPlugin.flatConfigs?.recommended,
    importPlugin.flatConfigs?.typescript,
    nodePlugin.configs['flat/recommended-script'],
    {
        files: ['**/*.js'],
        ignores: ['node_modules/', 'dist/'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: globals.node,
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        plugins: {
            js: eslint,
            n: nodePlugin,
        },
        extends: ['js/recommended'],
        linterOptions: {
            reportUnusedDisableDirectives: true,
        },
        rules: {
            'no-unused-vars': ['error', { args: 'none' }],
            'no-constant-condition': ['error', { checkLoops: false }],
            'quotes': ['error', 'single'],
            'semi': ['error', 'always'],
            'indent': ['error', 4, { SwitchCase: 1 }],
            'comma-dangle': ['error', 'always-multiline'],
            'eol-last': ['error', 'always'],
            'no-trailing-spaces': 'error',
            'object-curly-spacing': ['error', 'always'],
            'space-infix-ops': 'error',
            'no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }],
            'no-cond-assign': 'error',
            'no-unneeded-ternary': 'error',
            'no-irregular-whitespace': ['error', { skipStrings: true, skipTemplates: true }],
            'import/named': 'error',
            'import/no-unresolved': 'error',
            'n/exports-style': ['error', 'exports'],
            'n/handle-callback-err': 'warn',
            'no-promise-executor-return': 'error',
            'prefer-promise-reject-errors': 'warn',
            'require-await': 'warn',
            '@typescript-eslint/no-floating-promises': 'error',
        },
        settings: {
            'import/resolver': {
                node: {
                    extensions: ['.js'],
                },
            },
        },
    },
    {
        files: ['eslint.config.js'],
        rules: {
            'n/no-unpublished-import': 'off',
            'import/no-unresolved': 'off',
        },
    },
]);
