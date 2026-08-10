"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Database, Settings, UserCircle2 } from 'lucide-react';

export function TopNavBar() {
  const pathname = usePathname();
  
  const isChat = pathname === '/chat' || pathname === '/';
  const isIngest = pathname === '/ingest';

  return (
    <nav className="flex justify-between items-center w-full px-md md:px-margin-desktop h-20 z-50 bg-background/30 font-body-md text-body-md top-0 sticky border-b border-outline-variant backdrop-blur-xl shadow-sm">
      <div className="flex items-center gap-8">
        <Link href="/" className="font-headline-md text-headline-md text-white tracking-tight flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Database className="w-6 h-6 text-primary" />
          RAG.ai
        </Link>
        <div className="hidden md:flex gap-6">
          <Link 
            href="/chat" 
            className={`cursor-pointer active:scale-95 transition-colors duration-200 px-2 py-1 rounded-sm ${isChat ? 'text-primary border-b-2 border-primary pb-1 font-medium' : 'text-on-surface-variant hover:text-white'}`}
          >
            Chat
          </Link>
          <Link 
            href="/ingest" 
            className={`cursor-pointer active:scale-95 transition-colors duration-200 px-2 py-1 rounded-sm ${isIngest ? 'text-primary border-b-2 border-primary pb-1 font-medium' : 'text-on-surface-variant hover:text-white'}`}
          >
            Ingest
          </Link>
        </div>
      </div>
      <div className="flex items-center gap-5 text-on-surface-variant">
        <button className="hover:text-white transition-colors">
          <Settings className="w-6 h-6" />
        </button>
        <button className="hover:text-white transition-colors">
          <UserCircle2 className="w-7 h-7" />
        </button>
      </div>
    </nav>
  );
}
