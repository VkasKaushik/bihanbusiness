import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BIHAN BUSINESS',
  description: 'Operating System for BIHAN HOME CARE Founders',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#5046E5',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F8F9FD] text-[#111827] antialiased selection:bg-indigo-100">
        <div className="mx-auto max-w-md md:max-w-xl min-h-screen flex flex-col md:shadow-2xl md:border-x md:border-[#ECEEF3] bg-[#F8F9FD]">
          {children}
        </div>
      </body>
    </html>
  );
}
