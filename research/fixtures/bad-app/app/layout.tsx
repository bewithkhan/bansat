import Script from 'next/script';
import { Footer } from '@/components/Footer';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" />
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-TEST" strategy="afterInteractive" />
        <Script id="hotjar">{`(function(h,o,t,j,a,r){h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};a=o.getElementsByTagName('head')[0];r=o.createElement('script');r.async=1;r.src='https://static.hotjar.com/c/hotjar-'+j+'.js?sv=6';a.appendChild(r);})(window,document,0,1)`}</Script>
      </head>
      <body>
        {children}
        <Footer />
      </body>
    </html>
  );
}
