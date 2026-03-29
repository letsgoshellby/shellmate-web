/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'shellmate-web-theta.vercel.app',
          },
        ],
        destination: 'https://shellmate.letsgoshellby.com/:path*',
        permanent: true, // 301 리다이렉트
      },
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.shellmate.letsgoshellby.com',
          },
        ],
        destination: 'https://shellmate.letsgoshellby.com/:path*',
        permanent: true, // 301 리다이렉트
      },
    ];
  },
};

export default nextConfig;
