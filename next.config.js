/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // ajuste esse valor conforme o tamanho médio dos seus documentos
    },
  },
};

module.exports = nextConfig;