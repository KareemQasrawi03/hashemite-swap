import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import AdminShell from '@/components/admin/AdminShell';

export const metadata: Metadata = {
  title: 'لوحة الإدارة · مقايضة الهاشمية',
  robots: { index: false, follow: false },
};

/** Admin pages use their own sidebar; they do not share the public site's rail or footer. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
