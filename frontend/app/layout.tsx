import type { Metadata } from 'next';
import { IBM_Plex_Sans, Sora } from 'next/font/google';
import './globals.css';

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Inova CRM AI',
  description: 'Plataforma CRM SaaS — Inova TI',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#141416',
  viewportFit: 'cover' as const,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${sora.variable} ${ibmPlexSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
