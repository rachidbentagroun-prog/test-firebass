/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-src 'self' https://player.vimeo.com https://www.youtube.com; child-src 'self' https://player.vimeo.com https://www.youtube.com;"
          }
        ]
      }
    ];
  },
};

module.exports = nextConfig;
