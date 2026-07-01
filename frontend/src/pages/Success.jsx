import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

export default function Success() {
  return (
    <div className="max-w-xl mx-auto px-6 py-24 text-center">
      <div className="border border-[#27272A] bg-[#0f0f10] p-12">
        <CheckCircle2 className="w-16 h-16 text-[#34C759] mx-auto mb-6" />
        <h1 className="font-display text-4xl tracking-tighter mb-3">Access ready</h1>
        <p className="text-[#A1A1AA] mb-8">
          Use the activation key from Telegram to continue creating on the website.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/auth" className="bg-[#E1FF01] text-black px-6 py-3 font-medium">Enter key</Link>
          <Link to="/app" className="border border-[#27272A] px-6 py-3">Open studio</Link>
        </div>
      </div>
    </div>
  );
}
