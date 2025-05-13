import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/auth-provider';
import Header from '@/components/header';
import { ChildProfilesProvider } from '@/contexts/child-profiles-context';
import { ActiveChildProfileProvider } from '@/contexts/active-child-profile-context';
import { SidebarProvider } from '@/components/ui/sidebar';


const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
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

