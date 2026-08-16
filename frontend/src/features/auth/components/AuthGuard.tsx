'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/authStore';

const PUBLIC_PATHS = ['/login', '/register'];

// Map route prefixes to required page permissions
const PAGE_PERMISSION_MAP: Record<string, string> = {
  '/chat': 'chat',
  '/ingest': 'ingest',
  '/admin': 'admin',
};

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, loadFromStorage } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (isLoading) return;

    const isPublicPath = PUBLIC_PATHS.includes(pathname);

    if (!user && !isPublicPath) {
      router.replace('/login');
      return;
    }

    if (user && isPublicPath) {
      router.replace('/chat');
      return;
    }

    // Check RBAC page permissions
    if (user) {
      for (const [prefix, page] of Object.entries(PAGE_PERMISSION_MAP)) {
        if (pathname.startsWith(prefix) && !user.pages.includes(page)) {
          router.replace('/chat');
          return;
        }
      }
    }
  }, [user, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-on-surface-variant text-body-md">Loading...</p>
        </div>
      </div>
    );
  }

  // On public pages, render even if not logged in
  if (PUBLIC_PATHS.includes(pathname)) {
    return <>{children}</>;
  }

  // On protected pages, only render if logged in
  if (!user) {
    return null;
  }

  return <>{children}</>;
}
