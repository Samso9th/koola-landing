import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/dm-sans';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: new URL('https://koola.store'),
  title: 'Koola | Good food. Closer to you.',
  description: 'Food from the kitchens you love, delivered to your door. Koola is coming to Kano and Katsina. Join the waitlist or become a partner.',
  openGraph: { title: 'Good food. Closer to you.', description: 'Koola is coming to Kano and Katsina.', url: 'https://koola.store', siteName: 'Koola', type: 'website' },
  robots: { index: true, follow: true },
};
export const viewport: Viewport = { themeColor: '#F6EFE4', width: 'device-width', initialScale: 1 };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
