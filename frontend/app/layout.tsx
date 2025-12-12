import type { Metadata } from 'next';
import './globals.css';
import Header from './components/ui/Header';
import Footer from './components/ui/Footer';
import { AuthProvider } from './components/contexts/AuthContext';

export const metadata: Metadata = {
  title: 'Art plazaa  - Premium Stationery',
  description: 'Your one-stop shop for premium art supplies and stationery',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Google Fonts via <link> to avoid next/font build-time optimization issues with Turbopack */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>

      <body style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial" }}>
        <AuthProvider>
          <Header />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}