'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, ArrowRight, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('vikas');
  const [password, setPassword] = useState('bihan123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (userToLogin = username, passToLogin = password) => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: userToLogin, password: passToLogin }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to login');
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
    <div className="flex-1 flex flex-col justify-between p-6 bg-gradient-to-b from-blue-950 via-bihan-navy to-slate-900 text-white min-h-screen">
      <div className="pt-10 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-3xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/10">
          <Sparkles className="w-8 h-8 text-blue-400" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">BIHAN BUSINESS</h1>
        <p className="text-blue-200/80 text-sm mt-1">BIHAN HOME CARE • Chhattisgarh</p>
        <p className="text-xs text-blue-300/60 mt-0.5">Founders Operating System</p>
      </div>

      <div className="w-full my-auto py-6">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/15 shadow-2xl">
          <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-3">
            Quick 1-Tap Founder Select
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => {
                setUsername('vikas');
                handleLogin('vikas', 'bihan123');
              }}
              disabled={loading}
              className={`p-4 rounded-2xl border text-left transition-all ${
                username === 'vikas'
                  ? 'bg-sky-500/30 border-sky-400 text-white shadow-md'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
              }`}
            >
              <div className="text-xl mb-1">👨‍💼</div>
              <div className="font-bold text-base">Vikas</div>
              <div className="text-xs text-sky-200">Co-Founder</div>
            </button>

            <button
              type="button"
              onClick={() => {
                setUsername('rupesh');
                handleLogin('rupesh', 'bihan123');
              }}
              disabled={loading}
              className={`p-4 rounded-2xl border text-left transition-all ${
                username === 'rupesh'
                  ? 'bg-purple-500/30 border-purple-400 text-white shadow-md'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
              }`}
            >
              <div className="text-xl mb-1">👨‍💼</div>
              <div className="font-bold text-base">Rupesh</div>
              <div className="text-xs text-purple-200">Co-Founder</div>
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            className="space-y-4"
          >
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Username</label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black/25 border border-white/20 rounded-xl pl-11 pr-4 py-2.5 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/25 border border-white/20 rounded-xl pl-11 pr-4 py-2.5 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all text-sm mt-2"
            >
              {loading ? (
                <span className="inline-block animate-spin">⏳</span>
              ) : (
                <>
                  <span>Open BIHAN App</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="pb-4 text-center text-xs text-blue-300/60">
        Private Business System • Encrypted Session
      </div>
    </div>
  );
}
