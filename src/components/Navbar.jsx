import React from 'react';
import { useApp } from '../context/AppContext.jsx';
import { LayoutDashboard, Users, ClipboardList, LogOut, Wrench } from 'lucide-react';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'technicians', label: 'Technicians', icon: Users },
  { id: 'joborders', label: 'Job Orders', icon: ClipboardList }
];

export default function Navbar() {
  const { user, activeTab, setActiveTab, logout } = useApp();

  return (
    <nav className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40 shadow-lg">
      <div className="mx-auto px-4 max-w-screen-2xl">
        <div className="flex items-center justify-between h-16">

          {/* Brand */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Wrench className="h-5 w-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg hidden sm:block">TechScheduler</span>
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:block">{label}</span>
              </button>
            ))}
          </div>

          {/* User */}
          <div className="flex items-center gap-3 shrink-0">
            {user?.picture && (
              <img src={user.picture} alt={user.name} className="h-8 w-8 rounded-full border-2 border-slate-600" />
            )}
            <div className="hidden md:block text-right">
              <p className="text-white text-sm font-medium leading-none">{user?.name}</p>
              <p className="text-slate-400 text-xs mt-0.5">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="text-slate-400 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-slate-700"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}
