import type { ReactNode } from 'react';
import Rail from '@/components/Rail';
import Footer from '@/components/Footer';
import AddListingModal from '@/components/AddListingModal';

/** Public pages: icon rail, content column, footer and the add-listing modal. */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="site-shell">
      <Rail />
      <div className="wrap">
        <main id="main">{children}</main>
        <Footer />
      </div>
      <AddListingModal />
    </div>
  );
}
