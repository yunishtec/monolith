
import type {Metadata} from 'next';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { AudioProvider } from '@/context/AudioContext';
import { FocusProvider } from '@/context/FocusContext';

export const metadata: Metadata = {
  title: 'MONOLITH V2',
  description: 'Zero-clutter high-performance workspace',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=JetBrains+Mono:wght@400;700&family=Lora:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <AudioProvider>
            <FocusProvider>
              {children}
            </FocusProvider>
          </AudioProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
