/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
    };

    // Ignore lightningcss native bindings that can't be resolved in this environment
    config.plugins = config.plugins || [];

    const webpack = require('webpack');
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\.\/pkg$/,
        contextRegExp: /lightningcss/,
      })
    );

    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^lightningcss-/,
        contextRegExp: /lightningcss/,
      })
    );

    return config;
  },
  experimental: {
    optimizeCss: false,
  },
};

module.exports = nextConfig;
