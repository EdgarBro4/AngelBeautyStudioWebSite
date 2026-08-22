import './globals.css';
import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Angel Beauty Studio | Luxury Hair & Nails',
  description: 'Premium beauty services in an elevated, intimate studio setting. Book your appointment online.',
  icons: {
    icon: [{ url: '/favicon.png', sizes: '256x256', type: 'image/png' }],
    apple: [{ url: '/favicon.png', sizes: '256x256', type: 'image/png' }],
    shortcut: '/favicon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      </body>
    </html>
  );
}
