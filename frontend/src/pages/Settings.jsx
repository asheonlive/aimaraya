import React from "react";
import { useAuth } from "@/lib/auth";
import { User, Mail, Shield } from "lucide-react";

export default function Settings() {
  const { user, logout } = useAuth();
  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-10 py-10 space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-tighter">Settings</h1>
        <p className="text-sm text-[#a89dc9]">Manage your account</p>
      </div>
      <div className="card-purple p-6">
        <div className="text-xs uppercase tracking-[0.2em] text-[#a89dc9] mb-4">Profile</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-[#a89dc9] mb-1 flex items-center gap-2"><User className="w-3 h-3" /> Name</label>
            <input readOnly value={user.name} className="w-full bg-[#0d0919] border border-[#2a2340] rounded-lg px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="text-xs text-[#a89dc9] mb-1 flex items-center gap-2"><Mail className="w-3 h-3" /> Email</label>
            <input readOnly value={user.email} className="w-full bg-[#0d0919] border border-[#2a2340] rounded-lg px-3 py-2.5 text-sm" />
          </div>
        </div>
      </div>
      <div className="card-purple p-6">
        <div className="text-xs uppercase tracking-[0.2em] text-[#a89dc9] mb-4">Plan</div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg">Free · {user.credits} credits</div>
            <div className="text-xs text-[#a89dc9]">Upgrade to unlock priority generation.</div>
          </div>
          <a href="/pricing" className="btn-primary text-sm">Upgrade</a>
        </div>
      </div>
      <div className="card-purple p-6">
        <div className="text-xs uppercase tracking-[0.2em] text-[#a89dc9] mb-4 flex items-center gap-2"><Shield className="w-3 h-3" /> Session</div>
        <button onClick={logout} data-testid="settings-logout" className="text-sm text-[#ff3b7a] hover:text-white transition">Log out</button>
      </div>
    </div>
  );
}
