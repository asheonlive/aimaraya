import React from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-[#27272A] mt-24 relative z-10">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 bg-[#E1FF01] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-black" strokeWidth={2.5} />
            </div>
            <span className="font-display text-xl font-semibold">maraya<span className="text-[#E1FF01]">.</span>ai</span>
          </div>
          <p className="text-sm text-[#A1A1AA] max-w-sm leading-relaxed">
            The professional creative studio for image and video generation.
            One subscription. Every frontier model.
          </p>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-[0.2em] text-[#A1A1AA] mb-4">Product</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/models" className="hover:text-[#E1FF01]">Models</Link></li>
            <li><Link to="/studio" className="hover:text-[#E1FF01]">Studio</Link></li>
            <li><Link to="/pricing" className="hover:text-[#E1FF01]">Pricing</Link></li>
            <li><Link to="/explore" className="hover:text-[#E1FF01]">Explore</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-[0.2em] text-[#A1A1AA] mb-4">Company</h4>
          <ul className="space-y-2 text-sm text-[#A1A1AA]">
            <li>Manifesto</li>
            <li>Privacy</li>
            <li>Terms</li>
            <li>Contact</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[#27272A] py-6 text-center text-xs text-[#52525B] font-mono">
        © {new Date().getFullYear()} MARAYA AI — GENERATE BEYOND LIMITS
      </div>
    </footer>
  );
}
