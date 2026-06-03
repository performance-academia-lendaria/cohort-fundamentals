import type { Metadata } from 'next';
import { Inter, Orbitron } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-orbitron',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Pesquisa — Sistema 4D | Academia Lendária',
  description:
    'Antes do nosso encontro ao vivo, responde rápido pra gente preparar um caso REAL na sua medida.',
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${orbitron.variable}`}>
      <body>{children}</body>
    </html>
  );
}
