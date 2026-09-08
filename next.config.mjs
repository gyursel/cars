/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // Vercel image optimizer връщаше 400 за Supabase снимките.
    // Изключваме оптимизацията - next/image пак дава lazy-loading
    // и без layout shift, само компресията отпада засега.
    unoptimized: true,
  },
};

export default nextConfig;
