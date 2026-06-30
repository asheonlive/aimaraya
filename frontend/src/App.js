import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Landing from "@/pages/Landing";
import Models from "@/pages/Models";
import Studio from "@/pages/Studio";
import Dashboard from "@/pages/Dashboard";
import Pricing from "@/pages/Pricing";
import Auth from "@/pages/Auth";
import Success from "@/pages/Success";
import Explore from "@/pages/Explore";
import "@/App.css";

function Shell({ children, hideFooter }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#050505] text-[#f4f4f5] grain">
      <Navbar />
      <main className="flex-1 relative z-10">{children}</main>
      {!hideFooter && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster theme="dark" position="top-right" />
        <Routes>
          <Route path="/" element={<Shell><Landing /></Shell>} />
          <Route path="/models" element={<Shell><Models /></Shell>} />
          <Route path="/explore" element={<Shell><Explore /></Shell>} />
          <Route path="/studio" element={<Shell hideFooter><Studio /></Shell>} />
          <Route path="/dashboard" element={<Shell><Dashboard /></Shell>} />
          <Route path="/pricing" element={<Shell><Pricing /></Shell>} />
          <Route path="/auth" element={<Shell><Auth /></Shell>} />
          <Route path="/success" element={<Shell><Success /></Shell>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
