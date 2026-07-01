import React from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-[#2a2340] mt-24 relative z-10">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg gradient-purple flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display text-xl font-semibold">ArtCraft <span className="gradient-text">AI</span></span>
          </div>
          <p className="text-sm text-[#a89dc9] max-w-sm leading-relaxed">
            The all-in-one AI creative studio. Generate cinematic videos, realistic images, characters and ads with 26+ frontier models.
          </p>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-[0.2em] text-[#a89dc9] mb-4">Product</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/models" className="hover:text-[#c084fc] text-[#a89dc9]">Models</Link></li>
            <li><Link to="/app" className="hover:text-[#c084fc] text-[#a89dc9]">Studio</Link></li>
            <li><Link to="/pricing" className="hover:text-[#c084fc] text-[#a89dc9]">Pricing</Link></li>
            <li><Link to="/explore" className="hover:text-[#c084fc] text-[#a89dc9]">Explore</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-[0.2em] text-[#a89dc9] mb-4">Company</h4>
          <ul className="space-y-2 text-sm text-[#a89dc9]">
            <li>About</li>
            <li>Privacy</li>
            <li>Terms</li>
            <li>Contact</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[#2a2340] py-6 text-center text-xs text-[#6b6188] font-mono">
        © {new Date().getFullYear()} ARTCRAFT AI · CREATE BEYOND LIMITS
      </div>
    </footer>
  );
}
