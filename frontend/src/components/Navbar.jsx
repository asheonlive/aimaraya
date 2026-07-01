import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Sparkles, LogOut } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const items = [
    { to: "/models", label: "Models" },
    { to: "/studio", label: "Studio" },
    { to: "/explore", label: "Explore" },
    { to: "/pricing", label: "Pricing" },
  ];
  return (
    <header className="sticky top-0 z-40 backdrop-blur-2xl bg-[#050505]/70 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link to="/" data-testid="nav-logo" className="flex items-center gap-2 group">
          <div className="w-7 h-7 bg-[#E1FF01] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-black" strokeWidth={2.5} />
          </div>
          <span className="font-display text-xl font-semibold tracking-tighter">maraya<span className="text-[#E1FF01]">.</span>ai</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              data-testid={`nav-${it.label.toLowerCase()}`}
              className={({ isActive }) =>
                `text-sm tracking-tight transition-colors ${isActive ? "text-[#E1FF01]" : "text-[#A1A1AA] hover:text-white"}`
              }
            >
              {it.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link to="/dashboard" data-testid="nav-credits" className="hidden sm:flex items-center gap-2 px-3 py-1.5 border border-[#27272A] hover:border-[#E1FF01] transition-colors">
                <span className="text-xs uppercase tracking-[0.2em] text-[#A1A1AA]">Daily videos</span>
                <span className="font-mono text-sm text-[#E1FF01]">{user.daily_videos_remaining ?? user.credits ?? 0}/{user.daily_video_limit ?? 12}</span>
              </Link>
              <button data-testid="nav-logout" onClick={() => { logout(); nav("/"); }} className="p-2 text-[#A1A1AA] hover:text-white transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <Link to="/auth" data-testid="nav-signin" className="text-sm text-[#A1A1AA] hover:text-white">Sign in</Link>
              <Link to="/auth?mode=register" data-testid="nav-getstarted" className="bg-[#E1FF01] text-black text-sm font-medium px-5 py-2 hover:-translate-y-0.5 transition-transform">
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
