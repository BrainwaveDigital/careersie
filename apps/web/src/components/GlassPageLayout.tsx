'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LogOut } from 'lucide-react';
import { supabaseClient } from '@/lib/supabase';

interface GlassPageLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backHref?: string;
  showLogout?: boolean;
}

export default function GlassPageLayout({
  children,
  title,
  subtitle,
  showBack = true,
  backHref = '/dashboard',
  showLogout = true,
}: GlassPageLayoutProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
    router.push('/login');
  };

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-xl border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {showBack && (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-lg rounded-full text-white hover:bg-white/20 transition-all border border-white/20"
                >
                  <ArrowLeft size={18} />
                  Back
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-purple-300 text-sm">{subtitle}</p>
                )}
              </div>
            </div>
            
            {showLogout && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-lg rounded-full text-white hover:bg-white/20 transition-all border border-white/20"
              >
                <LogOut size={20} />
                Logout
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

// Glass Card Component for consistent styling
export function GlassCard({
  children,
  className = '',
  gradient,
}: {
  children: React.ReactNode;
  className?: string;
  gradient?: string;
}) {
  return (
    <div className={`relative bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 overflow-hidden ${className}`}>
      {gradient && (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10`} />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
