import type { NextConfig } from 'next';
import type { Configuration } from 'webpack';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@account-book/types', '@account-book/utils'],
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
  // Docker環境でのホットリロード対応
  webpack: (config: Configuration, { isServer }): Configuration => {
    if (!isServer && !config.watchOptions) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;

