"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Database, Settings, LogOut, Shield } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/authStore';

export function TopNavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  // Don't show nav on auth pages
  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  // Don't show nav if not logged in
  if (!user) return null;

  const isChat = pathname === '/chat' || pathname === '/';
  const isIngest = pathname?.startsWith('/ingest');
  const isAdmin = pathname?.startsWith('/admin');

  const hasIngestAccess = user.pages.includes('ingest');
  const hasAdminAccess = user.pages.includes('admin');

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <nav className="relative flex justify-between items-center w-full px-md md:px-margin-desktop h-20 z-50 bg-background/30 font-body-md text-body-md top-0 sticky border-b border-outline-variant backdrop-blur-xl shadow-sm">
      <div className="flex items-center">
        <Link href="/" className="font-headline-md text-headline-md text-white tracking-tight flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Database className="w-6 h-6 text-primary" />
          RAG.ai
        </Link>
      </div>

      <div className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
        <Link 
          href="/chat" 
          className={`cursor-pointer active:scale-95 transition-colors duration-200 px-2 py-1 rounded-sm ${isChat ? 'text-primary border-b-2 border-primary pb-1 font-medium' : 'text-on-surface-variant hover:text-white'}`}
        >
          Chat
        </Link>
        {hasIngestAccess && (
          <Link 
            href="/ingest" 
            className={`cursor-pointer active:scale-95 transition-colors duration-200 px-2 py-1 rounded-sm ${isIngest ? 'text-primary border-b-2 border-primary pb-1 font-medium' : 'text-on-surface-variant hover:text-white'}`}
          >
            Ingest
          </Link>
        )}
        {hasAdminAccess && (
          <Link 
            href="/admin" 
            className={`cursor-pointer active:scale-95 transition-colors duration-200 px-2 py-1 rounded-sm flex items-center gap-1 ${isAdmin ? 'text-primary border-b-2 border-primary pb-1 font-medium' : 'text-on-surface-variant hover:text-white'}`}
          >
            <Shield className="w-4 h-4" />
            Admin
          </Link>
        )}
      </div>

      <div className="flex items-center gap-4 text-on-surface-variant">
        <div className="hidden md:flex items-center gap-2 text-body-sm">
          <span className="text-on-surface-variant">{user.displayName || user.email}</span>
          <span className="text-xs bg-surface-container-high px-2 py-0.5 rounded-full text-on-surface-variant/70">
            {user.roleName}
          </span>
        </div>
        <button 
          onClick={handleLogout}
          className="hover:text-white transition-colors flex items-center gap-1 text-body-sm"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
}
