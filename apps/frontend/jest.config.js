const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // next.config.jsとNext.jsアプリへのパスを提供
  dir: './',
});

// Jestに渡すカスタム設定
const customJestConfig = {
  // セットアップファイルを追加（オプション）
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // TypeScriptのパスマッピング
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@account-book/types$': '<rootDir>/../../libs/types/src/index.ts',
    '^@account-book/utils$': '<rootDir>/../../libs/utils/src/index.ts',
  },

  // テスト環境
  testEnvironment: 'jest-environment-jsdom',

  // カバレッジ設定
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
  ],

  // テストファイルのパターン
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}',
  ],

  // モジュール検索パス
  modulePaths: ['<rootDir>/src'],

  // トランスフォーム設定
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react',
        },
      },
    ],
  },

  // モジュール拡張子
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // テストタイムアウト
  testTimeout: 10000,
};

// createJestConfigはこのようにエクスポートして、next/jestが非同期でNext.jsの設定をロードできるようにします
module.exports = createJestConfig(customJestConfig);
