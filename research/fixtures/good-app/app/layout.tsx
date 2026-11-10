import { Inter } from 'next/font/google'; // downloaded at build time and served from our own domain
import { Analytics } from '@/components/Analytics';
import { ConsentBanner } from '@/components/ConsentBanner';
import { Footer } from '@/components/Footer';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={inter.className}>
      <body>
        {children}
        <Footer />
        <ConsentBanner />
        <Analytics />
      </body>
    </html>
  );
}
