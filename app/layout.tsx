import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { IBM_Plex_Sans_Arabic, Readex_Pro } from 'next/font/google';
import AppProvider from '@/components/AppProvider';
import Toast from '@/components/Toast';
import { fetchLookups } from '@/lib/data';
import { DEFAULT_LOOKUPS } from '@/lib/defaults';
import { isConfigured } from '@/lib/supabase';
import type { Lookups } from '@/lib/types';
import './globals.css';

const plex = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex',
  display: 'swap',
});
const readex = Readex_Pro({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-readex',
  display: 'swap',
});


export const metadata: Metadata = {
  title: 'مقايضة الهاشمية',
  description: 'سوق مقايضة لطلاب الجامعة الهاشمية: كتب، أدوات مخبر، إلكترونيات وأكثر، بدون دفع نقود.',
  openGraph: { title: 'مقايضة الهاشمية', description: 'سوق مقايضة لطلاب الجامعة الهاشمية' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#c8102e',
};

// Lookup tables change rarely; re-read them at most hourly.
export const revalidate = 3600;

// Applies the saved theme and language before first paint so the page does not flash.
// Light is the default; dark or "device" only apply when the visitor picked them in Settings.
const PREFS_SCRIPT = `try{var r=document.documentElement,t=JSON.parse(localStorage.getItem('hu.theme'));if(t==='dark')r.setAttribute('data-theme','dark');else if(t==='auto')r.removeAttribute('data-theme');if(JSON.parse(localStorage.getItem('hu.lang'))==='en'){r.lang='en';r.dir='ltr'}}catch(e){}`;

async function loadLookups(): Promise<Lookups> {
  if (!isConfigured) return DEFAULT_LOOKUPS;
  try {
    const l = await fetchLookups();
    return l.colleges.length && l.categories.length && l.conditions.length ? l : DEFAULT_LOOKUPS;
  } catch {
    return DEFAULT_LOOKUPS;
  }
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const lookups = await loadLookups();
  return (
    <html lang="ar" dir="rtl" data-theme="light" className={`${plex.variable} ${readex.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREFS_SCRIPT }} />
      </head>
      <body>
        <AppProvider lookups={lookups} configured={isConfigured}>
          {children}
          <Toast />
        </AppProvider>
      </body>
    </html>
  );
}
