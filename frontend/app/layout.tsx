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
  title: {
    default: 'Inova CRM AI',
    template: '%s · Inova CRM AI',
  },
  description: 'Plataforma CRM SaaS — Inova TI',
  applicationName: 'Inova CRM AI',
  authors: [{ name: 'Inova TI' }],
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: ['/favicon-32x32.png'],
  },
  appleWebApp: {
    capable: true,
    title: 'Inova CRM',
    statusBarStyle: 'black-translucent',
  },
  openGraph: {
    title: 'Inova CRM AI',
    description: 'Plataforma CRM SaaS — Inova TI',
    siteName: 'Inova CRM AI',
    type: 'website',
  },
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
