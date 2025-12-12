'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import AdminSidebar from '../components/admin/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // don't run until we've finished the initial auth check
    if (isLoading) return;

    // determine the desired target route (null = no navigation)
    let target: string | null = null;

    // if on a protected page and not authenticated -> go to login
    if (!pathname.startsWith('/admin/login') && !isAuthenticated) {
      target = '/admin/login';
    }
    // if on login page and authenticated -> go to dashboard
    else if (pathname.startsWith('/admin/login') && isAuthenticated) {
      target = '/admin';
    }

    // only navigate if we have a target AND it's different from current
    if (target && pathname !== target) {
      router.replace(target);
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  // Show loading while the hook is checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // If on the login page render children directly
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // If not authenticated, render nothing (redirect will happen)
  if (!isAuthenticated) {
    return null;
  }

  // Authenticated admin layout
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-center items-center">
            <h1 className="text-xl font-bold text-gray-900">Art plazaa  Admin</h1>
          </div>
        </div>
      </div>

      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
