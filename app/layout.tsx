import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { IBM_Plex_Sans_Arabic, Readex_Pro } from 'next/font/google';
import AppProvider from '@/components/AppProvider';
import Rail from '@/components/Rail';
import Footer from '@/components/Footer';
import Toast from '@/components/Toast';
import AddListingModal from '@/components/AddListingModal';
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

const ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%230b7a5c'/%3E%3Ctext x='32' y='46' font-size='40' text-anchor='middle' fill='white' font-family='sans-serif' font-weight='700'%3E%D9%87%3C/text%3E%3C/svg%3E";

export const metadata: Metadata = {
  title: 'مقايضة الهاشمية',
  description: 'سوق مقايضة لطلاب الجامعة الهاشمية: كتب، أدوات مخبر، إلكترونيات وأكثر، بدون دفع نقود.',
  icons: { icon: ICON },
  openGraph: { title: 'مقايضة الهاشمية', description: 'سوق مقايضة لطلاب الجامعة الهاشمية' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0b7a5c',
};

// Lookup tables change rarely; re-read them at most hourly.
export const revalidate = 3600;

// Applies the saved theme and language before first paint so the page does not flash.
const PREFS_SCRIPT = `try{var r=document.documentElement,t=JSON.parse(localStorage.getItem('hu.theme'));if(t==='light'||t==='dark')r.setAttribute('data-theme',t);if(JSON.parse(localStorage.getItem('hu.lang'))==='en'){r.lang='en';r.dir='ltr'}}catch(e){}`;

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
    <html lang="ar" dir="rtl" className={`${plex.variable} ${readex.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREFS_SCRIPT }} />
      </head>
      <body>
        <AppProvider lookups={lookups} configured={isConfigured}>
          <Rail />
          <div className="wrap">
            <main id="main">{children}</main>
            <Footer />
          </div>
          <AddListingModal />
          <Toast />
        </AppProvider>
      </body>
    </html>
  );
}
