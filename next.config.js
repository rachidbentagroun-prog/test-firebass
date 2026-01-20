/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            // CSP updated to allow Vimeo embeds and keep Google/Firebase integrations secure
            value:
              "frame-src 'self' https://accounts.google.com https://*.google.com https://www.gstatic.com https://apis.google.com https://*.firebaseapp.com https://player.vimeo.com https://vimeo.com https://*.vimeo.com; " +
              "child-src 'self' https://player.vimeo.com https://vimeo.com https://*.vimeo.com https://www.youtube.com;"
          }
        ]
      }
    ];
  },
};

module.exports = nextConfig;
