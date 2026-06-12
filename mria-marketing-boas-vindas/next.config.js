/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/',
        destination: '/mria-marketing-boas-vindas/pesquisa/onboarding',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
