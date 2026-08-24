/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: false,
    outputFileTracingIncludes: {
      '/creditos/[id]/estado-cuenta': ['./node_modules/pdfkit/**/*', './node_modules/fontkit/**/*', './node_modules/@react-pdf/**/*'],
    },
  },
};
export default nextConfig;
