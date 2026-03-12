/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '../pkg': false,
    };
    return config;
  },
};

module.exports = nextConfig;
