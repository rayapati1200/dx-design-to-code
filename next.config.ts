import type { NextConfig } from 'next';

// Preview images are rendered with `unoptimized`, so no remote image patterns are needed.
// (A wildcard pattern would turn /_next/image into an open image proxy.)
const nextConfig: NextConfig = {};

export default nextConfig;
