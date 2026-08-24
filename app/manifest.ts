import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Crédito Fácil',
    short_name: 'Crédito Fácil',
    description: 'Gestión profesional de créditos personales',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f5f7fb',
    theme_color: '#4f46e5',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
