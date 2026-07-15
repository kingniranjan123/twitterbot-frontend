// components/Sidebar.js
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, Settings, BarChart3, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Tweets', href: '/tweets', icon: <FileText size={20} /> },
    { name: 'Accounts', href: '/accounts', icon: <Users size={20} /> },
    { name: 'Logs', href: '/logs', icon: <BarChart3 size={20} /> },
    { name: 'Settings', href: '/settings', icon: <Settings size={20} /> },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 glass-panel border-r border-[#2d2d3a] flex flex-col z-50">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent">
          T-Bot <span className="text-xs align-top text-gray-500">v2</span>
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items - center gap - 3 px - 4 py - 3 rounded - xl transition - all duration - 200 group
                ${isActive
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : 'text-gray-400 hover:bg-[#1b1b29] hover:text-white'
                } `}
            >
              <span className={`${isActive ? 'text-purple-400' : 'group-hover:text-pink-400 transition-colors'} `}>
                {item.icon}
              </span>
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#2d2d3a]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-left text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
