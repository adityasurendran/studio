"use client";
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/auth-provider';
import Header from '@/components/header';
import { ChildProfilesProvider } from '@/contexts/child-profiles-context';
import { ActiveChildProfileProvider, useActiveChildProfile } from '@/contexts/active-child-profile-context';
import { SidebarProvider } from '@/components/ui/sidebar';
import ServiceWorkerRegistrator from '@/components/service-worker-registrator';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Head from 'next/head';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'nyro',
  description: 'nyro: AI-powered personalized learning for children with learning difficulties.',
};

function BodyWithFont({ children }: { children: React.ReactNode }) {
  const { activeChild } = useActiveChildProfile();
  // Only apply .no-x-scroll if not on the homepage
  const isHome = typeof window !== 'undefined' ? window.location.pathname === '/' : false;
  let bodyClass = `${geistSans.variable} ${geistMono.variable} antialiased${!isHome ? ' no-x-scroll' : ''}`;
  if (
    activeChild &&
    typeof activeChild.learningDifficulties === 'string' &&
    activeChild.learningDifficulties.toLowerCase().includes('dyslexic')
  ) {
    bodyClass += ' font-dyslexic';
  }
  return (
    <body className={bodyClass}>
      <ServiceWorkerRegistrator />
      <AuthProvider>
        <ChildProfilesProvider>
          <ActiveChildProfileProvider>
            <SidebarProvider>
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-grow w-full px-2 sm:px-4 md:px-8">{children}</main>
              </div>
              <Toaster />
            </SidebarProvider>
          </ActiveChildProfileProvider>
        </ChildProfilesProvider>
      </AuthProvider>
    </body>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </Head>
      <BodyWithFont>{children}</BodyWithFont>
    </html>
  );
}

