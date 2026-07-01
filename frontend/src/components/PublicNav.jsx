import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Sparkles, Zap } from "lucide-react";

export default function PublicNav() {
  const { user } = useAuth();
  const nav = useNavigate();
  const items = [
    { to: "/", label: "Home" },
    { to: "/models", label: "Models" },
    { to: "/explore", label: "Explore" },
    { to: "/pricing", label: "Pricing" },
  ];
  return (
    <header className="sticky top-0 z-40 backdrop-blur-2xl bg-[#07050f]/80 border-b border-[#2a2340]">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link to="/" data-testid="nav-logo" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg gradient-purple flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display text-xl font-semibold tracking-tighter">AI <span className="gradient-text">MARAYA</span></span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              data-testid={`nav-${it.label.toLowerCase()}`}
              className={({ isActive }) =>
                `text-sm tracking-tight transition-colors ${isActive ? "text-white" : "text-[#a89dc9] hover:text-white"}`
              }
            >
              {it.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <Link to="/app" data-testid="nav-open-app" className="btn-primary text-sm inline-flex items-center gap-2">
              <Zap className="w-4 h-4" /> Open Studio
            </Link>
          ) : (
            <>
              <Link to="/auth" data-testid="nav-signin" className="text-sm text-[#a89dc9] hover:text-white">Log in</Link>
              <Link to="/auth?mode=register" data-testid="nav-getstarted" className="btn-primary text-sm">
                Start Creating
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
