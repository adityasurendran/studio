import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/auth-provider';
import Header from '@/components/header';
import { ChildProfilesProvider } from '@/contexts/child-profiles-context';
import { ActiveChildProfileProvider } from '@/contexts/active-child-profile-context';
import { SidebarProvider } from '@/components/ui/sidebar';
import ServiceWorkerRegistrator from '@/components/service-worker-registrator';


const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// OpenDyslexic font for users with dyslexia
const openDyslexic = localFont({
  src: [
    {
      path: '../fonts/OpenDyslexic-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/OpenDyslexic-Bold.otf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../fonts/OpenDyslexic-Italic.otf',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../fonts/OpenDyslexic-BoldItalic.otf',
      weight: '700',
      style: 'italic',
    },
  ],
  variable: '--font-opendyslexic',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Shannon',
  description: 'Shannon: AI-powered personalized learning for children with learning difficulties.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${openDyslexic.variable} antialiased`}>
        <ServiceWorkerRegistrator />
        <AuthProvider>
          <ChildProfilesProvider>
            <ActiveChildProfileProvider>
              <SidebarProvider>
                <div className="flex flex-col min-h-screen">
                  <Header />
                  <main className="flex-grow">{children}</main>
                </div>
                <Toaster />
              </SidebarProvider>
            </ActiveChildProfileProvider>
          </ChildProfilesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

