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
import CreatePage from "@/pages/CreatePage";
import VideoStudio from "@/pages/VideoStudio";
import Assets from "@/pages/Assets";
import Models from "@/pages/Models";
import Settings from "@/pages/Settings";
import ComingSoon from "@/pages/ComingSoon";
import Storyboard from "@/pages/Storyboard";
import Profile from "@/pages/Profile";
import About from "@/pages/About";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import Contact from "@/pages/Contact";
import "@/App.css";

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
          <Route path="/about" element={<PublicShell><About /></PublicShell>} />
          <Route path="/privacy" element={<PublicShell><Privacy /></PublicShell>} />
          <Route path="/terms" element={<PublicShell><Terms /></PublicShell>} />
          <Route path="/contact" element={<PublicShell><Contact /></PublicShell>} />

          {/* App */}
          <Route path="/app" element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route path="create-image" element={<CreatePage mode="image" />} />
            <Route path="create-video" element={<CreatePage mode="video" />} />
            <Route path="edit-image" element={<ComingSoon title="Image Editor" tagline="Inpainting, outpainting and object-swap — coming soon." />} />
            <Route path="edit-3d" element={<ComingSoon title="3D Editor" tagline="Turn images into 3D scenes." />} />
            <Route path="video-editor" element={<VideoStudio />} />
            <Route path="background-change" element={<ComingSoon title="Background Change" tagline="Swap or remove backgrounds instantly." />} />
            <Route path="moodboard" element={<ComingSoon title="Moodboard" tagline="Organize references into projects." />} />
            <Route path="library" element={<Assets />} />
            <Route path="library/folders" element={<ComingSoon title="Folders" tagline="Group your generations into projects." />} />
            <Route path="templates" element={<Templates />} />
            <Route path="generations" element={<Assets />} />
            <Route path="assets" element={<Assets />} />
            <Route path="explore" element={<Explore />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
            <Route path="account" element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
