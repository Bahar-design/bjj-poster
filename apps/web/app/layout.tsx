import type { Metadata } from 'next';
import { Bebas_Neue, Outfit, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas-neue',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BJJ Poster Builder | Create Professional Tournament Posters',
  description: 'Create stunning professional tournament posters for BJJ athletes. Showcase your achievements with premium designs.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bebasNeue.variable} ${outfit.variable} ${jetbrainsMono.variable} dark`}
    >
      <body className="font-body antialiased min-h-screen bg-surface-950">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
