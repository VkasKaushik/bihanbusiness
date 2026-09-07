'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutGrid,
  BarChart2,
  Package,
  PieChart,
  Sliders,
  Bell,
  Plus,
  LogOut,
} from 'lucide-react';
import { CurrentUser } from '@/types';
import UniversalPlusModal from '@/components/common/UniversalPlusModal';

import { IST_TIMEZONE, getISTHeaderDateDisplay } from '@/lib/date-utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [plusModalOpen, setPlusModalOpen] = useState(false);
  const [headerDate, setHeaderDate] = useState('');

  useEffect(() => {
    setHeaderDate(getISTHeaderDateDisplay());
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) {
          router.push('/login');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
        }
        setLoading(false);
      })
      .catch(() => {
        router.push('/login');
      });
  }, [router]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#F8F9FD]">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-indigo-500/20 animate-pulse">
          B
        </div>
        <p className="text-slate-400 font-medium text-xs mt-3">Loading BIHAN...</p>
      </div>
    );
  }

  // Four primary destinations: Pulse, Sales, Money, More (Stock moved inside More)
  const leftNavItems = [
    { href: '/', label: 'Pulse', icon: LayoutGrid },
    { href: '/sales', label: 'Sales', icon: BarChart2 },
  ];

  const rightNavItems = [
    { href: '/money', label: 'Money', icon: PieChart },
    { href: '/more', label: 'More', icon: Sliders },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F8F9FD] pb-24 print:pb-0 print:bg-white">
      {/* 1. TOP HEADER: Clean, calm and premium */}
      <header className="sticky top-0 z-30 bg-[#F8F9FD]/95 backdrop-blur-md px-4 pt-3.5 pb-2.5 flex items-center justify-between border-b border-[#ECEEF3] print:hidden">
        {/* Left: [B] Logo + BIHAN BUSINESS + small date below */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
            B
          </div>
          <div>
            <div className="text-sm font-black text-slate-900 tracking-tight leading-none">
              BIHAN BUSINESS
            </div>
            <div className="text-[11px] font-medium text-slate-400 mt-1">
              {headerDate || 'Sunday, 6 Sep 2026'}
            </div>
          </div>
        </div>

        {/* Right: User profile picture / avatar only */}
        <div
          title={`Logged in as ${user?.name || 'Founder'}`}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm border border-white cursor-pointer ${
            user?.username === 'vikas' ? 'bg-indigo-600' : 'bg-purple-600'
          }`}
        >
          {user?.name?.[0] || 'V'}
        </div>
      </header>

      {/* Main Screen Content */}
      <main className="flex-1 px-4 py-2 print:p-0 print:m-0">{children}</main>

      {/* 2. BOTTOM NAVIGATION: Pulse, Sales, [+], Money, More */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#ECEEF3] shadow-nav px-3 py-2 print:hidden">
        <div className="max-w-md md:max-w-xl mx-auto flex items-center justify-between relative">
          {/* Left Nav Items (Pulse, Sales) */}
          <div className="flex items-center justify-around flex-1">
            {leftNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                    isActive
                      ? 'text-indigo-600 font-extrabold'
                      : 'text-slate-400 hover:text-slate-600 font-medium'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 mb-0.5 ${
                      isActive ? 'stroke-[2.5] text-indigo-600' : 'stroke-[1.7]'
                    }`}
                  />
                  <span className="text-[10px] tracking-tight">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Center Elevated Floating Hexagon / Squircle + Button */}
          <div className="flex items-center justify-center px-2 -mt-6">
            <button
              onClick={() => setPlusModalOpen(true)}
              className="w-12 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white flex items-center justify-center shadow-elevated border-4 border-white transition-all group"
              title="Record Transaction"
            >
              <Plus className="w-6 h-6 stroke-[3] group-hover:rotate-90 transition-transform duration-200" />
            </button>
          </div>

          {/* Right Nav Items (Money, More) */}
          <div className="flex items-center justify-around flex-1">
            {rightNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                    isActive
                      ? 'text-indigo-600 font-extrabold'
                      : 'text-slate-400 hover:text-slate-600 font-medium'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 mb-0.5 ${
                      isActive ? 'stroke-[2.5] text-indigo-600' : 'stroke-[1.7]'
                    }`}
                  />
                  <span className="text-[10px] tracking-tight">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Universal + Action Modal (New Sale, Collection, Expense, Add Stock, Production) */}
      <UniversalPlusModal
        isOpen={plusModalOpen}
        onClose={() => setPlusModalOpen(false)}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
