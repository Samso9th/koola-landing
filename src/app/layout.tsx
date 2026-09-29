import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/dm-sans';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: new URL('https://koola.store'),
  title: 'Koola | Good food. Closer to you.',
  description: 'Food from the kitchens you love, delivered to your door. Koola is coming to Kano and Katsina. Join the waitlist or become a partner.',
  openGraph: {
    title: 'Good food. Closer to you.',
    description: 'Koola is coming to Kano and Katsina.',
    url: 'https://koola.store',
    siteName: 'Koola',
    type: 'website',
    images: [{ url: '/brand/koola-og.png', width: 1200, height: 630, alt: 'Koola — Good food. Closer to you.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Koola | Good food. Closer to you.',
    description: 'Koola is coming to Kano and Katsina.',
    images: ['/brand/koola-og.png'],
  },
  icons: {
    icon: [{ url: '/brand/favicon.png', sizes: '32x32', type: 'image/png' }, { url: '/brand/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: '/brand/apple-touch-icon.png',
  },
  robots: { index: true, follow: true },
};
export const viewport: Viewport = { themeColor: '#F6EFE4', width: 'device-width', initialScale: 1 };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
