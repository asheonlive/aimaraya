import React, { useEffect } from "react";
import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import {
  Home, Wand2, Video, Image as ImageIcon, LayoutGrid, FolderOpen,
  Compass, CreditCard, Settings as SettingsIcon, Sparkles, LogOut, Zap, Bell,
} from "lucide-react";

const NAV = [
  { to: "/app", label: "Home", icon: Home, end: true },
  { to: "/app/create", label: "Create", icon: Wand2 },
  { to: "/app/image-studio", label: "Image Studio", icon: ImageIcon },
  { to: "/app/video-studio", label: "Video Studio", icon: Video },
  { to: "/app/templates", label: "Templates", icon: LayoutGrid },
  { to: "/app/generations", label: "My Generations", icon: FolderOpen },
  { to: "/app/explore", label: "Explore", icon: Compass },
];

export default function AppShell() {
  const { user, logout, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && !user) nav("/auth");
  }, [loading, user, nav]);

  if (!user) return null;

  return (
    <div className="min-h-screen flex bg-[#07050f] text-[#f5f3ff] grain">
      {/* SIDEBAR */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-[#2a2340] bg-[#0d0919]/80 backdrop-blur-xl sticky top-0 h-screen">
        <Link to="/" className="flex items-center gap-2.5 px-6 h-16 border-b border-[#2a2340]">
          <div className="w-8 h-8 rounded-lg gradient-purple flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display text-lg font-semibold">ArtCraft <span className="gradient-text">AI</span></span>
        </Link>
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-0.5">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              data-testid={`side-${label.toLowerCase().replace(/\s+/g, "-")}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-[#a855f7]/20 to-transparent text-white border border-[#a855f7]/30"
                    : "text-[#a89dc9] hover:text-white hover:bg-[#1a1530]/50 border border-transparent"
                }`
              }
            >
              <Icon className="w-4 h-4" strokeWidth={1.75} />
              <span>{label}</span>
            </NavLink>
          ))}
          <div className="pt-4 mt-4 border-t border-[#2a2340] space-y-0.5">
            <NavLink to="/pricing" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#a89dc9] hover:text-white hover:bg-[#1a1530]/50 border border-transparent">
              <CreditCard className="w-4 h-4" strokeWidth={1.75} /> Pricing
            </NavLink>
            <NavLink to="/app/settings" data-testid="side-settings" className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                isActive
                  ? "bg-gradient-to-r from-[#a855f7]/20 to-transparent text-white border border-[#a855f7]/30"
                  : "text-[#a89dc9] hover:text-white hover:bg-[#1a1530]/50 border border-transparent"
              }`}>
              <SettingsIcon className="w-4 h-4" strokeWidth={1.75} /> Settings
            </NavLink>
          </div>
        </nav>
        {/* Credits card */}
        <div className="p-4 border-t border-[#2a2340]">
          <div className="card-purple p-4">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#a89dc9] mb-1">Credits</div>
            <div className="font-display text-3xl gradient-text">{user.credits.toLocaleString()}</div>
            <Link to="/pricing" data-testid="side-upgrade" className="mt-3 w-full block text-center gradient-purple text-white text-xs font-medium py-2 rounded-lg hover:opacity-90 transition">
              Upgrade Plan
            </Link>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* TOP BAR */}
        <header className="sticky top-0 z-30 h-16 border-b border-[#2a2340] bg-[#07050f]/80 backdrop-blur-xl flex items-center justify-between px-6 lg:px-10">
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-purple flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display font-semibold">ArtCraft <span className="gradient-text">AI</span></span>
          </div>
          <div className="flex-1 max-w-xl mx-auto hidden md:block">
            <div className="relative">
              <input
                type="text"
                placeholder="Search templates, tools, generations..."
                className="w-full bg-[#1a1530]/60 border border-[#2a2340] focus:border-[#a855f7]/60 rounded-xl px-4 py-2 text-sm placeholder:text-[#6b6188] outline-none transition-colors"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/pricing" data-testid="topbar-credits" className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#a855f7]/30 bg-[#a855f7]/10">
              <div className="w-2 h-2 rounded-full bg-[#a855f7] shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
              <span className="text-sm font-mono text-white">{user.credits.toLocaleString()}</span>
              <span className="text-xs text-[#a89dc9]">credits</span>
            </Link>
            <Link to="/pricing" className="btn-primary text-xs py-2 px-4 hidden sm:inline-flex">Upgrade</Link>
            <button className="p-2 text-[#a89dc9] hover:text-white transition"><Bell className="w-4 h-4" /></button>
            <button data-testid="topbar-logout" onClick={() => { logout(); nav("/"); }} className="p-2 text-[#a89dc9] hover:text-white transition">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>
        <main className="flex-1 relative z-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
