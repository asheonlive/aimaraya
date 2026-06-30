import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Auth() {
  const { login, register } = useAuth();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [mode, setMode] = useState(sp.get("mode") === "register" ? "register" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "register") await register(email, password, name);
      else await login(email, password);
      toast.success(mode === "register" ? "Welcome to Maraya" : "Welcome back");
      nav("/studio");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Authentication failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="w-full max-w-md border border-[#27272A] bg-[#0f0f10] p-10">
        <div className="text-xs uppercase tracking-[0.2em] text-[#A1A1AA] mb-3">// {mode === "register" ? "CREATE ACCOUNT" : "WELCOME BACK"}</div>
        <h1 className="font-display text-4xl tracking-tighter mb-2">{mode === "register" ? "Start creating" : "Sign in"}</h1>
        <p className="text-sm text-[#A1A1AA] mb-8">
          {mode === "register" ? "20 free credits. No card required." : "Glad to see you again."}
        </p>
        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && (
            <Input
              data-testid="auth-name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#050505] border-[#27272A] rounded-none h-12 focus-visible:ring-[#E1FF01]"
            />
          )}
          <Input
            data-testid="auth-email"
            type="email"
            required
            placeholder="you@studio.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-[#050505] border-[#27272A] rounded-none h-12 focus-visible:ring-[#E1FF01]"
          />
          <Input
            data-testid="auth-password"
            type="password"
            required
            minLength={6}
            placeholder="Password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-[#050505] border-[#27272A] rounded-none h-12 focus-visible:ring-[#E1FF01]"
          />
          <Button
            data-testid="auth-submit"
            type="submit"
            disabled={loading}
            className="w-full bg-[#E1FF01] text-black hover:bg-[#C8E600] rounded-none h-12 font-medium"
          >
            {loading ? "Please wait..." : mode === "register" ? "Create account" : "Sign in"}
          </Button>
        </form>
        <div className="text-center mt-6 text-sm text-[#A1A1AA]">
          {mode === "register" ? (
            <>Already a member? <button data-testid="auth-toggle" onClick={() => setMode("login")} className="text-[#E1FF01] underline">Sign in</button></>
          ) : (
            <>New to Maraya? <button data-testid="auth-toggle" onClick={() => setMode("register")} className="text-[#E1FF01] underline">Create account</button></>
          )}
        </div>
      </div>
    </div>
  );
}
