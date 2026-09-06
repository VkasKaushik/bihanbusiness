'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ShieldCheck, Check, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [selectedFounder, setSelectedFounder] = useState<'vikas' | 'rupesh'>('vikas');
  const [password, setPassword] = useState('bihan123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: selectedFounder, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-6 bg-[#F8F9FD] min-h-screen">
      {/* Top Branding */}
      <div className="pt-6 sm:pt-10 flex flex-col items-center text-center">
        <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-sm mb-3">
          B
        </div>
        <div className="text-xs font-black tracking-wider uppercase text-slate-900">
          BIHAN BUSINESS
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-6">
          Welcome back
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Sign in to continue managing your business.
        </p>
      </div>

      {/* Main Form Container */}
      <div className="w-full max-w-sm mx-auto my-auto py-6">
        <form onSubmit={handleLogin} className="space-y-5">
          {/* 1. SELECT ACCOUNT */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Select Account
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {/* Founder: Vikas */}
              <button
                type="button"
                onClick={() => {
                  setSelectedFounder('vikas');
                  setError('');
                }}
                className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 active:scale-98 ${
                  selectedFounder === 'vikas'
                    ? 'bg-indigo-50/60 border-indigo-600 ring-1 ring-indigo-600 shadow-xs'
                    : 'bg-white border-[#ECEEF3] hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                    selectedFounder === 'vikas'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  V
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-extrabold text-sm text-slate-900 leading-tight">
                    Vikas
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Co-Founder</div>
                </div>
                {selectedFounder === 'vikas' && (
                  <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </button>

              {/* Founder: Rupesh */}
              <button
                type="button"
                onClick={() => {
                  setSelectedFounder('rupesh');
                  setError('');
                }}
                className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 active:scale-98 ${
                  selectedFounder === 'rupesh'
                    ? 'bg-indigo-50/60 border-indigo-600 ring-1 ring-indigo-600 shadow-xs'
                    : 'bg-white border-[#ECEEF3] hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                    selectedFounder === 'rupesh'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  R
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-extrabold text-sm text-slate-900 leading-tight">
                    Rupesh
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Co-Founder</div>
                </div>
                {selectedFounder === 'rupesh' && (
                  <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* 2. PASSWORD INPUT */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-white border border-[#ECEEF3] focus:border-indigo-600 rounded-xl px-3.5 py-3 pr-10 text-sm font-semibold text-slate-900 focus:outline-none transition-all shadow-xs"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* 3. PRIMARY SIGN IN BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            {loading ? (
              <span className="inline-block animate-pulse">Signing in...</span>
            ) : (
              <>
                <span>Sign in</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Bottom Privacy / Security Footer */}
      <div className="pb-4 pt-2 text-center">
        <div className="inline-flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>Private business workspace</span>
        </div>
      </div>
    </div>
  );
}
