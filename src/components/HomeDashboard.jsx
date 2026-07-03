import React from 'react';
import { Calendar, Monitor, ChevronRight, LogOut } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { useApp } from '../context/AppContext.jsx';

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export default function HomeDashboard({ onEnterScheduler, onEnterDevices }) {
  const { user, login, logout } = useApp();

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const token = tokenResponse.access_token;
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json());
        await login(
          { name: userInfo.name, email: userInfo.email, picture: userInfo.picture },
          token
        );
      } catch (err) {
        console.error('Google login failed:', err);
      }
    },
    scope: 'https://www.googleapis.com/auth/spreadsheets',
  });

  return (
    <div className="min-h-screen bg-brand-darker flex flex-col overflow-hidden">

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-brand-darker border-b border-white/10 py-3.5 px-4 sm:px-6 md:px-8 shadow-md">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-1.5 select-none">
            <span className="w-2 h-2 rounded-full bg-brand-primary shadow-[0_0_6px_rgba(216,41,46,0.6)] shrink-0" />
            <span className="font-black tracking-wider text-white text-base font-sans">
              <span className="italic">i</span>NAV
            </span>
          </div>

          {/* Auth */}
          {user ? (
            <div className="flex items-center gap-3">
              {user.picture && (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-7 h-7 rounded-full border border-white/20"
                />
              )}
              <span className="text-white/60 text-xs font-medium hidden sm:block">{user.name}</span>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/25 text-xs font-medium transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => googleLogin()}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/15 text-white/60 hover:text-white hover:border-white/30 text-xs font-medium transition-colors"
            >
              <GoogleIcon />
              Sign in with Google
            </button>
          )}
        </div>
      </header>
      <div className="h-[53px]" />

      {/* Main content */}
      <div className="flex flex-col items-center pt-12 p-6">

        {/* Brand title */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <span className="w-3 h-3 rounded-full bg-brand-primary shadow-[0_0_12px_rgba(216,41,46,0.6)] shrink-0" />
            <h1 className="text-4xl font-black tracking-tight text-white">
              <span className="italic">i</span>NAV{' '}
              <span className="font-light text-white/50">Tools</span>
            </h1>
          </div>

        </div>

        {/* Tool cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-2xl">

          {/* Technician Scheduler */}
          <button
            onClick={onEnterScheduler}
            className="bg-brand-card border border-white/10 rounded-2xl p-8 shadow-sm
                       hover:border-brand-primary/40 hover:shadow-[0_0_24px_rgba(216,41,46,0.08)] hover:-translate-y-0.5
                       transition-all duration-200 group text-left cursor-pointer"
          >
            <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center mb-5
                            group-hover:bg-brand-primary/20 transition-colors">
              <Calendar className="h-6 w-6 text-brand-primary" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Technician Scheduler</h2>
            <p className="text-white/40 text-sm leading-relaxed">
              Schedule and manage field technician dispatches, track job orders, and monitor team performance.
            </p>
            <div className="mt-6 flex items-center gap-1.5 text-brand-primary text-sm font-semibold">
              Open Scheduler
              <ChevronRight className="h-4 w-4" />
            </div>
          </button>

          {/* Devices & Compatibility */}
          <button
            onClick={onEnterDevices}
            className="bg-brand-card border border-white/10 rounded-2xl p-8 shadow-sm
                       hover:border-brand-primary/40 hover:shadow-[0_0_24px_rgba(216,41,46,0.08)] hover:-translate-y-0.5
                       transition-all duration-200 group text-left cursor-pointer"
          >
            <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center mb-5
                            group-hover:bg-brand-primary/20 transition-colors">
              <Monitor className="h-6 w-6 text-brand-primary" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Devices &amp; Compatibility</h2>
            <p className="text-white/40 text-sm leading-relaxed">
              Browse and manage iNav device compatibility, sensors, and accessories for your fleet.
            </p>
            <div className="mt-6 flex items-center gap-1.5 text-brand-primary text-sm font-semibold">
              Open Devices
              <ChevronRight className="h-4 w-4" />
            </div>
          </button>

        </div>
      </div>


    </div>
  );
}
