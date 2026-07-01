import React, { useEffect, useState } from "react";
import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import {
  Home, Image as ImageIcon, Video, Pencil, Box, Film, Wand2, LayoutGrid,
  Grid3x3, Folder, GraduationCap, Newspaper, HelpCircle, Download,
  Sparkles, PanelLeft, LogOut, MessageCircle, Bell, Lock, Clapperboard,
} from "lucide-react";

const CREATE_NAV = [
  { to: "/app/create-image", label: "Image", icon: ImageIcon },
  { to: "/app/create-video", label: "Video", icon: Video },
  { to: "/app/storyboard", label: "Storyboard", icon: Clapperboard, badge: "NEW" },
  { to: "/app/edit-image", label: "Edit Image", icon: Pencil, locked: true },
  { to: "/app/edit-3d", label: "Edit 3D", icon: Box, locked: true },
  { to: "/app/video-editor", label: "Edit Video", icon: Film, locked: true },
  { to: "/app/background-change", label: "BG Change", icon: Wand2, locked: true },
  { to: "/app/moodboard", label: "Moodboard", icon: LayoutGrid, locked: true },
];
const ASSET_NAV = [
  { to: "/app/library", label: "Library", icon: Grid3x3 },
  { to: "/app/library/folders", label: "Folders", icon: Folder },
];
const RESOURCE_NAV = [
  { href: "#", label: "Tutorials", icon: GraduationCap },
  { href: "#", label: "News", icon: Newspaper },
  { href: "#", label: "FAQ", icon: HelpCircle },
];

function SideItem({ to, href, label, icon: Icon, beta, active }) {
  const base = "group/menu-item relative flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors";
  const cls = active
    ? "bg-white/[0.08] font-medium text-white"
    : "text-white/70 hover:bg-white/[0.05] hover:text-white";
  const content = (
    <>
      {active && <span className="pointer-events-none absolute inset-y-1.5 left-0 z-10 w-1 rounded-full bg-[#a855f7]" />}
      <Icon className="w-3.5 h-3.5 shrink-0 transition-transform group-hover/menu-item:scale-110" strokeWidth={1.75} />
      <span className="truncate">{label}</span>
      {beta && <span className="ml-auto bg-amber-600 text-white text-[10px] font-semibold uppercase leading-none rounded-full px-1.5 py-0.5">BETA</span>}
    </>
  );
  if (href) return <a href={href} target="_blank" rel="noreferrer" className={`${base} ${cls}`}>{content}</a>;
  return <NavLink to={to} data-testid={`side-${label.toLowerCase().replace(/\s+/g,"-")}`} className={`${base} ${cls}`}>{content}</NavLink>;
}

export default function AppShell() {
  const { user, logout, loading } = useAuth();
  const nav = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => { if (!loading && !user) nav("/auth"); }, [loading, user, nav]);
  if (!user) return null;

  return (
    <div className="min-h-screen flex bg-[#07050f] text-[#f5f3ff] grain">
      {/* SIDEBAR */}
      <aside className={`hidden lg:flex ${collapsed ? "w-16" : "w-56"} shrink-0 flex-col border-r border-white/[0.06] bg-[#0d0919]/90 backdrop-blur-xl sticky top-0 h-screen transition-all`}>
        {/* Header */}
        <div className="flex items-center gap-2 p-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-purple flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            {!collapsed && <span className="font-display font-semibold text-sm">AI <span className="gradient-text">MARAYA</span></span>}
          </Link>
          <button onClick={() => setCollapsed(!collapsed)} className="ml-auto p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/[0.06]">
            <PanelLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-3">
          {/* Home */}
          <div className="space-y-0.5">
            <NavLink to="/app" end data-testid="side-home" className={({ isActive }) => `${isActive ? "bg-white/[0.08] text-white" : "text-white/70 hover:bg-white/[0.05] hover:text-white"} flex items-center gap-2 rounded-md px-2 py-2 text-sm relative`}>
              <Home className="w-3.5 h-3.5" strokeWidth={1.75} />
              {!collapsed && <span>Home</span>}
            </NavLink>
          </div>

          {/* CREATE */}
          <div>
            {!collapsed && <div className="h-8 flex items-center px-2 text-[11px] font-semibold uppercase tracking-wider text-white/40">Create</div>}
            <ul className="space-y-0.5">
              {CREATE_NAV.map(it => (
                <li key={it.to}>
                  <NavLink to={it.to} data-testid={`side-${it.label.toLowerCase().replace(/\s+/g,"-")}`} className={({ isActive }) => `${isActive ? "bg-white/[0.08] text-white font-medium" : it.locked ? "text-white/40 hover:bg-white/[0.03]" : "text-white/70 hover:bg-white/[0.05] hover:text-white"} group/menu-item relative flex items-center gap-2 rounded-md px-2 py-2 text-sm`}>
                    {({ isActive }) => (
                      <>
                        {isActive && <span className="pointer-events-none absolute inset-y-1.5 left-0 z-10 w-1 rounded-full bg-[#a855f7]" />}
                        <it.icon className="w-3.5 h-3.5 shrink-0 transition-transform group-hover/menu-item:scale-110" strokeWidth={1.75} />
                        {!collapsed && <span className="truncate">{it.label}</span>}
                        {!collapsed && it.locked && <Lock className="ml-auto w-3 h-3 text-white/40" />}
                        {!collapsed && it.badge && <span className="ml-auto gradient-purple text-white text-[9px] font-semibold uppercase leading-none rounded-full px-1.5 py-0.5">{it.badge}</span>}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          {/* ASSETS */}
          <div>
            {!collapsed && <div className="h-8 flex items-center px-2 text-[11px] font-semibold uppercase tracking-wider text-white/40">Assets</div>}
            <ul className="space-y-0.5">
              {ASSET_NAV.map(it => (
                <li key={it.to}>
                  <NavLink to={it.to} data-testid={`side-${it.label.toLowerCase()}`} className={({ isActive }) => `${isActive ? "bg-white/[0.08] text-white font-medium" : "text-white/70 hover:bg-white/[0.05] hover:text-white"} flex items-center gap-2 rounded-md px-2 py-2 text-sm relative`}>
                    <it.icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                    {!collapsed && <span>{it.label}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          {/* RESOURCES */}
          {!collapsed && (
            <div>
              <div className="h-8 flex items-center px-2 text-[11px] font-semibold uppercase tracking-wider text-white/40">Resources</div>
              <ul className="space-y-0.5">
                {RESOURCE_NAV.map(it => (
                  <li key={it.href}>
                    <a href={it.href} target="_blank" rel="noreferrer" className="text-white/70 hover:bg-white/[0.05] hover:text-white flex items-center gap-2 rounded-md px-2 py-2 text-sm">
                      <it.icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                      <span>{it.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* SUPPORT */}
          {!collapsed && (
            <div>
              <div className="h-8 flex items-center px-2 text-[11px] font-semibold uppercase tracking-wider text-white/40">Support</div>
              <a href="https://discord.gg/" target="_blank" rel="noreferrer" className="text-white/70 hover:bg-white/[0.05] hover:text-white flex items-center gap-2 rounded-md px-2 py-2 text-sm">
                <MessageCircle className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Join Discord</span>
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        {!collapsed && (
          <div className="p-2 border-t border-white/[0.06]">
            <button className="w-full h-9 rounded-full gradient-purple text-white text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition">
              <Download className="w-3.5 h-3.5" /> Download AI MARAYA
            </button>
          </div>
        )}
      </aside>

      {/* MAIN */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 h-14 border-b border-white/[0.06] bg-[#07050f]/80 backdrop-blur-xl flex items-center justify-between px-4 lg:px-6">
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-purple flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display font-semibold text-sm">AI <span className="gradient-text">MARAYA</span></span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/pricing" data-testid="topbar-credits" className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#a855f7]/30 bg-[#a855f7]/10">
              <div className="w-1.5 h-1.5 rounded-full bg-[#a855f7] shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
              <span className="text-xs font-mono text-white">{user.credits.toLocaleString()}</span>
              <span className="text-[10px] text-white/60 uppercase tracking-wider">credits</span>
            </Link>
            <Link to="/pricing" className="btn-primary !py-1.5 !px-3 text-xs">Upgrade</Link>
            <button className="p-2 text-white/60 hover:text-white transition"><Bell className="w-4 h-4" /></button>
            <button data-testid="topbar-profile" onClick={() => nav("/app/profile")} className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-white/[0.06] transition">
              <div className="w-7 h-7 rounded-full gradient-purple flex items-center justify-center text-xs font-bold text-white">
                {(user.name || user.email || "?").charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:block text-xs text-white/80 max-w-[100px] truncate">{user.name || user.email.split("@")[0]}</span>
            </button>
            <button data-testid="topbar-logout" onClick={() => { logout(); nav("/"); }} className="p-2 text-white/60 hover:text-red-300 transition" title="Log out"><LogOut className="w-4 h-4" /></button>
          </div>
        </header>
        <main className="flex-1 relative z-10"><Outlet /></main>
      </div>
    </div>
  );
}
