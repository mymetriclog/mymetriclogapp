/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    // Silence known warning from @supabase/realtime-js dynamic require
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /@supabase\/realtime-js/, message: /Critical dependency/ },
    ];
    return config;
  },
};

export default nextConfig;
