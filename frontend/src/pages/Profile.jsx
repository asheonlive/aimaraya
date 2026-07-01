import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  User as UserIcon, Mail, Video as VideoIcon, Calendar, LogOut, Crown, Sparkles,
  Image as ImageIcon, Video, Copy, Check, ShieldCheck, Rocket,
} from "lucide-react";

export default function Profile() {
  const { user, logout, refresh } = useAuth();
  const nav = useNavigate();
  const [stats, setStats] = useState({ total: 0, images: 0, videos: 0, storyboards: 0 });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [g, s] = await Promise.all([
          api.get("/generations").catch(() => ({ data: { generations: [] } })),
          api.get("/storyboards").catch(() => ({ data: { storyboards: [] } })),
        ]);
        const gens = g.data.generations || [];
        setStats({
          total: gens.length,
          images: gens.filter(x => x.type === "image").length,
          videos: gens.filter(x => x.type === "video").length,
          storyboards: (s.data.storyboards || []).length,
        });
      } catch (e) { /* silent */ }
    })();
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    toast.success("Logged out");
    nav("/");
  };

  const copyId = () => {
    navigator.clipboard.writeText(user.id);
    setCopied(true);
    toast.success("User ID copied");
    setTimeout(() => setCopied(false), 1500);
  };

  const joinDate = user.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "—";
  const initial = (user.name || user.email || "?").charAt(0).toUpperCase();

  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-10 py-10" data-testid="profile-page">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl gradient-purple flex items-center justify-center">
          <UserIcon className="w-5 h-5 text-white" strokeWidth={2} />
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-white/50">// Account</div>
          <h1 className="font-display text-3xl tracking-tighter">Your Profile</h1>
        </div>
      </div>

      {/* Profile card */}
      <div className="card-purple p-6 md:p-8 mb-6 flex flex-col md:flex-row items-start md:items-center gap-6" data-testid="profile-card">
        <div className="relative">
          <div className="w-24 h-24 rounded-2xl gradient-purple flex items-center justify-center text-4xl font-display font-bold text-white shadow-lg shadow-[#a855f7]/30">
            {initial}
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#0d0919] border-2 border-[#a855f7] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#c084fc]" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-[0.2em] text-white/40 mb-1">Display Name</div>
          <div className="font-display text-2xl tracking-tighter mb-3" data-testid="profile-name">{user.name || user.email.split("@")[0]}</div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-[#a89dc9]">
            <div className="flex items-center gap-2" data-testid="profile-email">
              <Mail className="w-3.5 h-3.5" />
              <span className="truncate">{user.email}</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>Joined {joinDate}</span>
            </div>
          </div>
          <button onClick={copyId} className="mt-3 inline-flex items-center gap-2 text-[11px] font-mono text-white/50 hover:text-white transition" data-testid="profile-copy-id">
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{user.id}</span>
          </button>
        </div>
        <button
          onClick={handleLogout}
          data-testid="profile-logout-btn"
          className="w-full md:w-auto px-5 py-2.5 rounded-full border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:text-white transition text-sm font-semibold inline-flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" /> Log Out
        </button>
      </div>

      {/* Daily allowance + plan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card-purple p-5 md:col-span-2" data-testid="profile-credits">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/50">
              <VideoIcon className="w-3.5 h-3.5" /> Daily Video Allowance
            </div>
            <Crown className="w-4 h-4 text-[#c084fc]" />
          </div>
          <div className="flex items-baseline gap-2 mb-4">
            <div className="font-display text-5xl tracking-tighter gradient-text">{user.daily_videos_remaining ?? user.credits ?? 0}</div>
            <div className="text-xs uppercase tracking-wider text-white/50">of {user.daily_video_limit ?? 12} videos left today</div>
          </div>
          <Link to="/pricing" data-testid="profile-upgrade-btn" className="btn-primary text-sm inline-flex items-center gap-2">
            <Rocket className="w-4 h-4" /> Access Options
          </Link>
        </div>
        <div className="card-purple p-5" data-testid="profile-plan">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/50 mb-3">
            <ShieldCheck className="w-3.5 h-3.5" /> Plan
          </div>
          <div className="font-display text-2xl tracking-tighter mb-1">Activation Key</div>
          <div className="text-xs text-[#a89dc9] mb-4">Access is managed through Telegram.</div>
          <Link to="/pricing" className="text-xs text-[#c084fc] hover:underline">See access options →</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Generations" value={stats.total} icon={Sparkles} />
        <StatCard label="Images" value={stats.images} icon={ImageIcon} />
        <StatCard label="Videos" value={stats.videos} icon={Video} />
        <StatCard label="Storyboards" value={stats.storyboards} icon={Rocket} />
      </div>

      {/* Quick links */}
      <div className="card-purple p-6" data-testid="profile-quicklinks">
        <div className="text-xs uppercase tracking-[0.2em] text-white/50 mb-4">// Quick Links</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <QuickLink to="/app/library" label="My Library" desc="All generated media" />
          <QuickLink to="/app/create-image" label="Create Image" desc="Text-to-image studio" />
          <QuickLink to="/app/create-video" label="Create Video" desc="Text-to-video studio" />
          <QuickLink to="/app/storyboard" label="Storyboard Agent" desc="Prompt → shots → video" />
          <QuickLink to="/pricing" label="Billing & Plans" desc="Manage access" />
          <QuickLink to="/contact" label="Contact Support" desc="Report issues or ask questions" />
        </div>
      </div>

      {/* Danger zone */}
      <div className="mt-6 border border-red-500/30 rounded-2xl p-6 bg-red-500/5" data-testid="profile-danger">
        <div className="text-xs uppercase tracking-[0.2em] text-red-300 mb-3">// Danger Zone</div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="font-semibold text-white">Log out of AI MARAYA</div>
            <div className="text-xs text-[#a89dc9] mt-1">You'll be signed out on this device.</div>
          </div>
          <button
            onClick={handleLogout}
            data-testid="profile-logout-danger-btn"
            className="px-4 py-2 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-200 hover:text-white text-sm font-semibold inline-flex items-center gap-2 transition"
          >
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="card-purple p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/50 mb-2">
        <Icon className="w-3 h-3" /> {label}
      </div>
      <div className="font-display text-3xl tracking-tighter">{value}</div>
    </div>
  );
}

function QuickLink({ to, label, desc }) {
  return (
    <Link
      to={to}
      className="group flex items-center justify-between px-4 py-3 rounded-xl border border-white/[0.06] hover:border-[#a855f7]/40 hover:bg-white/[0.03] transition"
      data-testid={`quicklink-${label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div>
        <div className="text-sm font-medium text-white group-hover:text-[#c084fc] transition">{label}</div>
        <div className="text-[11px] text-[#a89dc9]">{desc}</div>
      </div>
      <span className="text-white/40 group-hover:text-[#c084fc] transition">→</span>
    </Link>
  );
}
