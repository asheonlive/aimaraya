import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default function Auth() {
  const { login, register } = useAuth();
  const nav = useNavigate();
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(key);
      toast.success("Welcome to AI MARAYA");
      nav("/app");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Activation failed");
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
          Activate access
        </h1>
        <p className="text-sm text-[#a89dc9] mb-8 text-center">
          Enter the activation key you received from the Telegram bot.
        </p>
        <form onSubmit={submit} className="space-y-3">
          <Input data-testid="auth-key" required placeholder="Activation key" value={key}
            onChange={(e) => setKey(e.target.value)}
            className="bg-[#0d0919] border-[#2a2340] rounded-xl h-12 focus-visible:ring-[#a855f7]" />
          <Button data-testid="auth-submit" type="submit" disabled={loading}
            className="w-full gradient-purple hover:opacity-90 rounded-xl h-12 font-medium">
            {loading ? "Please wait..." : "Continue"}
          </Button>
        </form>
        <div className="text-center mt-6 text-sm text-[#a89dc9]">Use Telegram to create or renew access.</div>
      </div>
    </div>
  );
}
