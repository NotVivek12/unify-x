"use client";

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, Bell, Settings, Activity } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useDemoMode } from '../../context/DemoModeContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Shipments', path: '/shipments', icon: Package },
  { name: 'Alerts', path: '/alerts', icon: Bell },
  { name: 'System', path: '/system', icon: Settings },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { scenario } = useDemoMode();
  
  const isSystemOnline = scenario !== 'OFFLINE';

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--color-background)] selection:bg-[var(--color-surface)]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 glass-panel z-10 sticky top-0 h-screen border-r border-t-0 border-b-0 border-l-0 border-[var(--color-border)] shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
        <div className="p-8 flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-foreground)] flex items-center justify-center text-white shadow-lg shadow-[var(--color-foreground)]/20">
            <Activity size={22} />
          </div>
          <span className="text-2xl font-bold tracking-tight text-[var(--color-foreground)]">UNIFY-X</span>
        </div>

        <nav className="flex-1 px-5 py-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.path || (item.path !== '/' && pathname?.startsWith(item.path));
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.path}
                className={cn(
                  "flex items-center space-x-4 px-4 py-3.5 rounded-xl transition-all duration-300 group",
                  isActive 
                    ? "bg-[var(--color-surface-hover)] text-[var(--color-foreground)] font-semibold shadow-sm border border-[var(--color-border-strong)] transform scale-[1.02]" 
                    : "text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)] hover:scale-[1.02] border border-transparent"
                )}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={cn("transition-colors", isActive ? "text-[var(--color-foreground)]" : "group-hover:text-[var(--color-foreground)]")} />
                <span className="text-[15px]">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-8 border-t border-[var(--color-border)]">
          <div className="flex items-center space-x-3 glass-panel px-4 py-3 rounded-2xl">
            <div className={cn("w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.2)]", isSystemOnline ? "bg-[var(--color-brand-good)] shadow-[var(--color-brand-good)]" : "bg-[var(--color-muted)]")} />
            <span className="text-sm font-semibold tracking-wide text-[var(--color-foreground)]">
              {isSystemOnline ? 'System Online' : 'Offline Mode'}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0 overflow-y-auto custom-scrollbar relative z-0">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-5 glass-panel sticky top-0 z-20 border-b border-[var(--color-border)] shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-foreground)] flex items-center justify-center text-white shadow-md">
              <Activity size={18} />
            </div>
            <span className="text-xl font-bold tracking-tight text-[var(--color-foreground)]">UNIFY-X</span>
          </div>
          <div className={cn("w-2.5 h-2.5 rounded-full shadow-sm", isSystemOnline ? "bg-[var(--color-brand-good)] shadow-[var(--color-brand-good)]" : "bg-[var(--color-muted)]")} />
        </header>
        
        <div className="flex-1 p-5 md:p-10 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-t border-[var(--color-border)] z-30 pb-safe">
        <div className="flex items-center justify-around p-2">
          {navItems.map((item) => {
            const isActive = pathname === item.path || (item.path !== '/' && pathname?.startsWith(item.path));
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.path}
                className={cn(
                  "flex flex-col items-center justify-center w-16 h-14 rounded-lg transition-colors",
                  isActive ? "text-[var(--color-foreground)] font-medium" : "text-[var(--color-muted)]"
                )}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={cn("mb-1", isActive ? "text-[var(--color-foreground)]" : "")} />
                <span className="text-[10px]">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
