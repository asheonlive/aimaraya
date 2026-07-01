import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

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
      toast.success(mode === "register" ? "Welcome to ArtCraft AI" : "Welcome back");
      nav("/app");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Authentication failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-10 relative">
      <div className="orb w-[500px] h-[500px] top-0 -right-40" />
      <div className="orb w-[400px] h-[400px] -bottom-20 -left-20" />
      <div className="relative w-full max-w-md card-purple p-10">
        <div className="w-12 h-12 rounded-xl gradient-purple mx-auto flex items-center justify-center mb-6">
          <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <h1 className="font-display text-3xl tracking-tighter mb-2 text-center">
          {mode === "register" ? "Create your account" : "Welcome back"}
        </h1>
        <p className="text-sm text-[#a89dc9] mb-8 text-center">
          {mode === "register" ? "100 free credits · no card required." : "Sign in to continue creating."}
        </p>
        <form onSubmit={submit} className="space-y-3">
          {mode === "register" && (
            <Input data-testid="auth-name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)}
              className="bg-[#0d0919] border-[#2a2340] rounded-xl h-12 focus-visible:ring-[#a855f7]" />
          )}
          <Input data-testid="auth-email" type="email" required placeholder="you@studio.com" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-[#0d0919] border-[#2a2340] rounded-xl h-12 focus-visible:ring-[#a855f7]" />
          <Input data-testid="auth-password" type="password" required minLength={6}
            placeholder="Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)}
            className="bg-[#0d0919] border-[#2a2340] rounded-xl h-12 focus-visible:ring-[#a855f7]" />
          <Button data-testid="auth-submit" type="submit" disabled={loading}
            className="w-full gradient-purple hover:opacity-90 rounded-xl h-12 font-medium">
            {loading ? "Please wait…" : mode === "register" ? "Create account" : "Sign in"}
          </Button>
        </form>
        <div className="text-center mt-6 text-sm text-[#a89dc9]">
          {mode === "register" ? (
            <>Already a member? <button data-testid="auth-toggle" onClick={() => setMode("login")} className="text-[#c084fc] underline">Sign in</button></>
          ) : (
            <>New to ArtCraft AI? <button data-testid="auth-toggle" onClick={() => setMode("register")} className="text-[#c084fc] underline">Create account</button></>
          )}
        </div>
      </div>
    </div>
  );
}
