/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/',
        destination: '/sistema-dspc/pesquisa',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
