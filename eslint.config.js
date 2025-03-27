import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';
import * as importPlugin from 'eslint-plugin-import';
import nodePlugin from 'eslint-plugin-n';
import globals from 'globals';
import jsdocPlugin from 'eslint-plugin-jsdoc';
import pluginPromise from 'eslint-plugin-promise';

export default defineConfig([
    eslint.configs.recommended,
    tseslint.configs.strictTypeChecked,
    tseslint.configs.stylisticTypeChecked,
    importPlugin.flatConfigs?.recommended,
    importPlugin.flatConfigs?.typescript,
    jsdocPlugin.configs['flat/contents-typescript-flavor-error'],
    nodePlugin.configs['flat/recommended-script'],
    pluginPromise.configs['flat/recommended'],
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
            'no-unused-vars': 'off', // Disabled, because we use `@typescript-eslint/no-unused-vars` instead
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
            'prefer-promise-reject-errors': 'warn',
            'no-promise-executor-return': 'error',
            'require-await': 'error',
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true, ignoreVoidOperator: true }],
            '@typescript-eslint/restrict-template-expressions': ['error', { allowAny: true, allowNullish: true, allowBoolean: true }],
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            '@typescript-eslint/no-unused-expressions': ['error', { allowShortCircuit: true }],
            '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
            '@typescript-eslint/no-unsafe-argument': 'off',
            '@typescript-eslint/no-unsafe-return': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/no-unsafe-call': 'off',
            '@typescript-eslint/prefer-nullish-coalescing': 'off',
            '@typescript-eslint/no-base-to-string': 'off',
            '@typescript-eslint/no-unnecessary-condition': 'off',
            'jsdoc/require-param': 'warn',
            'jsdoc/require-returns': 'warn',
            'jsdoc/check-tag-names': 'warn',
            'jsdoc/check-types': 'warn',
            'jsdoc/match-description': 'off',
            'jsdoc/informative-docs': 'off',
            'promise/prefer-await-to-then': 'warn',
        },
        settings: {
            'import/resolver': {
                node: {
                    extensions: ['.js'],
                },
            },
            'jsdoc': {
                'preferredTypes': {
                    // Primitives: favor lowercase unless you're writing constructors
                    'String': 'string',
                    'Boolean': 'boolean',
                    'Number': 'number',

                    // Arrays: stick to `type[]` over generics unless needed
                    'Array': {
                        'replacement': '[]',
                        'message': 'Use shorthand array types like `string[]` instead of `Array.<string>`',
                    },

                    // Objects: use lowercase unless you're writing constructors
                    'Object': {
                        'replacement': 'object',
                        'message': 'Use lowercase `object` for generic structures',
                    },

                    // Functions: use lowercase unless you're referring to the constructor
                    'Function': {
                        'replacement': 'function',
                        'message': 'Use lowercase `function` unless you\'re referring to the constructor',
                    },

                    // Date, RegExp, etc.: keep constructor casing (it's correct)
                    'date': 'Date',
                    'regexp': 'RegExp',

                    // Keep wildcard types allowed
                    '*': '*',
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
