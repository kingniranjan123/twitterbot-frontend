"use client";
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function ClientLayout({ children }) {
    const pathname = usePathname();
    // Hide sidebar on login page
    const showSidebar = pathname !== '/auth/login';

    return (
        <div className="flex min-h-screen">
            {showSidebar && <Sidebar />}
            <main className={`flex-1 bg-[var(--background)] ${showSidebar ? 'ml-64' : ''}`}>
                {children}
            </main>
        </div>
    );
}
