import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Crédito Fácil', description: 'Gestión profesional de créditos personales' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="es"><body>{children}</body></html>;
}
