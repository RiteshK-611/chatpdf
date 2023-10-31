/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
    config.module.rules.push({
      test: /\.node$/i,
      use: "node-loader",
    });
    // Important: return the modified config
    return config;
  },
};

module.exports = nextConfig;
