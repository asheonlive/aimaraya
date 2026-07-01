import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth";
import PublicNav from "@/components/PublicNav";
import Footer from "@/components/Footer";
import AppShell from "@/components/AppShell";
import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import Success from "@/pages/Success";
import Pricing from "@/pages/Pricing";
import Explore from "@/pages/Explore";
import Templates from "@/pages/Templates";
import Dashboard from "@/pages/Dashboard";
import Studio from "@/pages/Studio";
import VideoStudio from "@/pages/VideoStudio";
import Assets from "@/pages/Assets";
import Models from "@/pages/Models";
import Settings from "@/pages/Settings";
import "@/App.css";

/** Public marketing shell (top nav + footer) */
function PublicShell({ children, hideFooter }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#07050f] text-[#f5f3ff] grain">
      <PublicNav />
      <main className="flex-1 relative z-10">{children}</main>
      {!hideFooter && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster theme="dark" position="top-right" toastOptions={{
          style: { background: "#1a1530", border: "1px solid #2a2340", color: "#f5f3ff" }
        }} />
        <Routes>
          {/* Public */}
          <Route path="/" element={<PublicShell><Landing /></PublicShell>} />
          <Route path="/pricing" element={<PublicShell><Pricing /></PublicShell>} />
          <Route path="/models" element={<PublicShell><Models /></PublicShell>} />
          <Route path="/explore" element={<PublicShell><Explore /></PublicShell>} />
          <Route path="/auth" element={<PublicShell><Auth /></PublicShell>} />
          <Route path="/success" element={<PublicShell><Success /></PublicShell>} />

          {/* App (sidebar shell) */}
          <Route path="/app" element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route path="create" element={<Studio />} />
            <Route path="image-studio" element={<Studio />} />
            <Route path="video-studio" element={<VideoStudio />} />
            <Route path="templates" element={<Templates />} />
            <Route path="generations" element={<Assets />} />
            <Route path="assets" element={<Assets />} />
            <Route path="explore" element={<Explore />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
