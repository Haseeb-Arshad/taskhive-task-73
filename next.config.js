/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }
    const externals = Array.isArray(config.externals)
      ? config.externals
      : config.externals
      ? [config.externals]
      : [];
    config.externals = [...externals, 'lightningcss'];
    return config;
  },
};

module.exports = nextConfig;
