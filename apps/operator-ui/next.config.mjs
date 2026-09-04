// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import createNextIntlPlugin from 'next-intl/plugin';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// next-intl requires a project-relative path here, not an absolute one.
const withNextIntl = createNextIntlPlugin('./src/lib/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Trace from the monorepo root so the standalone output bundles workspace
  // dependencies (@citrineos/types) correctly.
  outputFileTracingRoot: resolve(__dirname, '../..'),
  devIndicators: {
    position: 'bottom-right',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/**',
      },
    ],
  },
  // Built with `next build --webpack`: Turbopack is the default bundler in Next 16,
  // but its standalone output still mishandles external module aliases, and this app
  // is shipped from .next/standalone. The alias below is required by
  // src/lib/utils/default-metadata-storage.ts.
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'class-transformer/types/storage': resolve(
        __dirname,
        'node_modules/class-transformer/cjs/storage.js',
      ),
    };
    return config;
  },
};

export default withNextIntl(nextConfig);
