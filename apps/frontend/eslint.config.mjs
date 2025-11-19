import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import nextPlugin from '@next/eslint-plugin-next';
import globals from 'globals';

export default tseslint.config(
    // Ignore patterns
    {
        ignores: [
            ".next/",
            "out/",
            "dist/",
            "node_modules/",
            ".env*.local",
            "jest.config.js",
            "jest.setup.js",
            "*.config.{js,mjs,cjs}",
            "next-env.d.ts",
        ],
    },

    // ベースとなる設定
    js.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,

    // React/Next.js関連のプラグイン設定
    {
        files: ['**/*.{js,jsx,ts,tsx}'],
        plugins: {
            react,
            'react-hooks': reactHooks,
            'jsx-a11y': jsxA11y,
            '@next/next': nextPlugin,
        },
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
                ecmaFeatures: { jsx: true },
            },
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
        rules: {
            // 各プラグインの推奨ルールを適用
            ...react.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,
            ...jsxA11y.configs.recommended.rules,
            ...nextPlugin.configs.recommended.rules,
            ...nextPlugin.configs['core-web-vitals'].rules,

            // 既存のカスタムルール
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/explicit-function-return-type': 'warn',
            '@typescript-eslint/explicit-module-boundary-types': 'warn',
            '@typescript-eslint/no-inferrable-types': 'off',
            
            // 型安全性ルール（段階的に改善）
            '@typescript-eslint/no-unused-vars': ['error', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
                caughtErrorsIgnorePattern: '^_',
            }],
            '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }], // Next.jsのイベントハンドラ対応
            '@typescript-eslint/no-floating-promises': 'warn', // 段階的に修正
            '@typescript-eslint/no-unsafe-enum-comparison': 'warn', // 段階的に修正
            '@typescript-eslint/no-unnecessary-type-assertion': 'warn', // 段階的に修正
            '@typescript-eslint/no-redundant-type-constituents': 'warn', // 段階的に修正

            // Next.js用のルール上書き
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off', // TypeScriptで型チェックするため

            // アクセシビリティルール（段階的に改善）
            'jsx-a11y/label-has-associated-control': 'warn', // 段階的に修正

            // コンソールに関するルール
            'no-console': ['error', { allow: ['warn', 'error'] }],
        },
    },
    
    // テストファイル用の設定
    {
        files: ['**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/e2e/**/*.ts'],
        languageOptions: {
            globals: {
                ...globals.jest,
            },
        },
        rules: {
            // テストファイルでは一部のルールを緩和
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off', // E2Eテストでは型安全性チェックを緩和
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/no-unsafe-call': 'off',
            '@typescript-eslint/no-unsafe-return': 'off',
            '@typescript-eslint/no-unsafe-argument': 'off',
        },
    },
    
    // 設定ファイルとJest関連ファイルは型チェックから除外
    {
        files: ['*.config.{js,mjs,cjs}', '*.setup.{js,mjs,cjs}', 'jest.config.js', 'jest.setup.js'],
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.jest,
            },
        },
        rules: {
            '@typescript-eslint/no-require-imports': 'off', // CommonJS許可
            'no-undef': 'off', // globalsで定義されているものでもno-undefが発火する場合があるため
        },
        ...tseslint.configs.disableTypeChecked,
    },
    
    // Next.js型定義ファイルは除外
    {
        files: ['next-env.d.ts'],
        rules: {
            '@typescript-eslint/triple-slash-reference': 'off',
        },
    }
);