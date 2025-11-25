import type { Preview } from '@storybook/react';
import '../src/app/globals.css';

// Storybook用のAPIモック設定
if (typeof window !== 'undefined') {
  // グローバルスコープでAPIモックを設定（必要に応じて）
  (window as unknown as { __STORYBOOK_MOCK__?: boolean }).__STORYBOOK_MOCK__ = true;
}

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
