'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    { href: '/dashboard', label: 'Overview', icon: '📊' },
    { href: '/dashboard/tickets', label: 'Tickets', icon: '🎫' },
    { href: '/dashboard/review', label: 'Review Queue', icon: '✅' },
    { href: '/dashboard/analytics', label: 'Analytics', icon: '📈' },
    { href: '/dashboard/knowledge-base', label: 'Knowledge Base', icon: '📚' },
    { href: '/dashboard/users', label: 'Users', icon: '👥', adminOnly: true },
    { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
    { href: '/dashboard/profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-10 hidden md:block">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">AI Support</h1>
          <p className="text-sm text-gray-500 mt-1">Autoresponder</p>
          {user && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-900">{user.name || user.email}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role || 'agent'}</p>
            </div>
          )}
        </div>
        
        <nav className="px-4">
          {navItems.map((item) => {
            // Hide admin-only items for non-admins
            if (item.adminOnly && user?.role !== 'admin') {
              return null;
            }
            
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Sidebar Toggle */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 p-4 z-20">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">AI Support</h1>
          <button className="p-2 text-gray-600 hover:text-gray-900">
            <span className="text-2xl">☰</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="md:ml-64 p-4 md:p-8 pt-20 md:pt-8">
        {children}
      </main>
    </div>
  );
}

