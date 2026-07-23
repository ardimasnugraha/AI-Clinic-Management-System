"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Mail, Lock, Heart, Activity, Users, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: authErr } = await supabase.auth.signInWithPassword({ email, password });
      if (authErr) {
        setError("Email atau kata sandi salah. Silakan coba lagi.");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setShowGoogleModal(true);
  };

  const handleRealGoogleOAuth = async () => {
    setShowGoogleModal(false);
    setError(null);
    setLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/` },
      });
    } catch (e: any) {
      setError("Gagal menghubungi Google OAuth: " + e.message);
      setLoading(false);
    }
  };

  const handleGoogleDemoLogin = async (demoEmail: string, fullName: string, role: string, poli: string) => {
    setError(null);
    setLoading(true);
    setShowGoogleModal(false);
    try {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: "admindokter123"
      });
      if (signInErr) {
        setError("Akun demo belum terbuat atau belum terverifikasi di database. Silakan jalankan 'node scripts/setup-db.js' pada terminal proyek Anda untuk membuat akun demo secara instan dan aman.");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan sistem saat mencoba masuk.");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Users, color: "#0d9488", bg: "#e0f9f6", title: "Manajemen Terpadu", desc: "Kelola pasien, jadwal, dan layanan dalam satu sistem terintegrasi." },
    { icon: Activity, color: "#8b5cf6", bg: "#ede9fe", title: "AI Assistant", desc: "Dapatkan insight dan rekomendasi cerdas untuk praktik klinik Anda." },
    { icon: ShieldCheck, color: "#f59e0b", bg: "#fef3c7", title: "Aman & Terpercaya", desc: "Keamanan data berstandar tinggi dan selalu terjaga kerahasiaannya." },
  ];

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #fdf8f5 0%, #fef2ee 50%, #fdf6fd 100%)",
      fontFamily: "'Inter', system-ui, sans-serif", padding: "20px"
    }}>
      <div style={{
        width: "100%", maxWidth: 1000, display: "grid", gridTemplateColumns: "1fr 1fr",
        background: "#fff", borderRadius: 28, overflow: "hidden",
        boxShadow: "0 32px 80px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.06)"
      }}>

        {/* LEFT PANEL */}
        <div style={{
          background: "linear-gradient(160deg, #fff9f7 0%, #fff5f0 100%)",
          padding: "48px 44px", display: "flex", flexDirection: "column", justifyContent: "space-between",
          borderRight: "1px solid #fde8df", position: "relative", overflow: "hidden"
        }}>
          {/* Decorative blobs */}
          <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,90,80,0.06)" }} />
          <div style={{ position: "absolute", bottom: 40, left: -40, width: 150, height: 150, borderRadius: "50%", background: "rgba(13,148,136,0.06)" }} />

          <div style={{ position: "relative" }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
              <div style={{ position: "relative" }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#ff5a50"/>
                  <path d="M10.5 10.5h3v3h3v3h-3v3h-3v-3h-3v-3h3v-3z" fill="#fff" style={{transformOrigin:"12px 12px"}}/>
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#0f172a", lineHeight: 1.2 }}>Sistem Manajemen</div>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#ff5a50", lineHeight: 1.2 }}>Klinik AI</div>
              </div>
            </div>

            {/* Badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fff4f2", border: "1px solid #ffd4cf", borderRadius: 20, padding: "5px 14px", marginBottom: 24 }}>
              <span style={{ fontSize: 14 }}>👋</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#e04939" }}>Selamat datang kembali!</span>
            </div>

            <h1 style={{ fontSize: 32, fontWeight: 900, color: "#0f172a", lineHeight: 1.2, marginBottom: 12 }}>
              Kelola klinik lebih<br />cerdas dengan AI
            </h1>
            <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7, marginBottom: 36 }}>
              Sistem terintegrasi untuk manajemen pasien, appointment, rekam medis, dan operasional klinik yang lebih efisien.
            </p>

            {/* Features */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {features.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: f.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon style={{ width: 20, height: 20, color: f.color }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>{f.title}</div>
                      <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{f.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Illustration */}
          <div style={{ position: "relative", display: "flex", justifyContent: "center", marginTop: 32 }}>
            <svg width="180" height="160" viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="100" cy="160" rx="70" ry="12" fill="#fde8df" opacity="0.6"/>
              {/* Doctor body */}
              <rect x="70" y="90" width="60" height="70" rx="20" fill="#e8f5e9"/>
              <rect x="75" y="95" width="50" height="60" rx="18" fill="#a5d6a7"/>
              {/* Stethoscope */}
              <circle cx="100" cy="120" r="8" fill="none" stroke="#4caf50" strokeWidth="2"/>
              <path d="M100 128 Q100 140 108 140" stroke="#4caf50" strokeWidth="2" fill="none"/>
              <circle cx="112" cy="140" r="3" fill="#4caf50"/>
              {/* Face */}
              <circle cx="100" cy="72" r="22" fill="#ffd180"/>
              <circle cx="93" cy="70" r="2" fill="#5d4037"/>
              <circle cx="107" cy="70" r="2" fill="#5d4037"/>
              <path d="M94 78 Q100 84 106 78" stroke="#5d4037" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
              {/* Hair */}
              <path d="M78 66 Q80 50 100 50 Q120 50 122 66 Q115 58 100 58 Q85 58 78 66z" fill="#5d4037"/>
              {/* Arms */}
              <rect x="55" y="100" width="18" height="30" rx="9" fill="#a5d6a7"/>
              <rect x="127" y="100" width="18" height="30" rx="9" fill="#a5d6a7"/>
              {/* Tablet */}
              <rect x="120" y="108" width="28" height="22" rx="4" fill="#e3f2fd" stroke="#90caf9" strokeWidth="1.5"/>
              <line x1="124" y1="115" x2="144" y2="115" stroke="#90caf9" strokeWidth="1"/>
              <line x1="124" y1="119" x2="140" y2="119" stroke="#90caf9" strokeWidth="1"/>
              {/* Plants */}
              <ellipse cx="30" cy="150" rx="18" ry="10" fill="#c8e6c9"/>
              <ellipse cx="170" cy="150" rx="18" ry="10" fill="#c8e6c9"/>
              <ellipse cx="18" cy="140" rx="12" ry="8" fill="#a5d6a7"/>
              <ellipse cx="182" cy="140" rx="12" ry="8" fill="#a5d6a7"/>
              {/* Sparkles */}
              <path d="M155 55 L157 60 L162 62 L157 64 L155 69 L153 64 L148 62 L153 60 Z" fill="#ffb74d" opacity="0.8"/>
              <path d="M40 80 L41.5 84 L45 85.5 L41.5 87 L40 91 L38.5 87 L35 85.5 L38.5 84 Z" fill="#ff8a65" opacity="0.7"/>
            </svg>
          </div>
        </div>

        {/* RIGHT PANEL — Login Form */}
        <div style={{ padding: "48px 48px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {/* Logo (right) */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#ff5a50"/>
              <path d="M10.5 10.5h3v3h3v3h-3v3h-3v-3h-3v-3h3v-3z" fill="#fff"/>
            </svg>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>Sistem Manajemen</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#ff5a50", lineHeight: 1.2 }}>Klinik AI</div>
            </div>
          </div>

          <h2 style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", marginBottom: 6 }}>Masuk ke akun Anda</h2>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 32 }}>Silakan masuk untuk melanjutkan ke dashboard</p>

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#dc2626", fontWeight: 600 }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Email */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Email</label>
              <div style={{ position: "relative" }}>
                <Mail style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#94a3b8" }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nama@klinikanda.co.id"
                  style={{
                    width: "100%", paddingLeft: 42, paddingRight: 16, paddingTop: 12, paddingBottom: 12,
                    borderRadius: 12, border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none",
                    background: "#fafafa", transition: "border 0.2s", fontFamily: "inherit"
                  }}
                  onFocus={e => e.target.style.borderColor = "#ff5a50"}
                  onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Kata Sandi</label>
              <div style={{ position: "relative" }}>
                <Lock style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#94a3b8" }} />
                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi Anda"
                  style={{
                    width: "100%", paddingLeft: 42, paddingRight: 46, paddingTop: 12, paddingBottom: 12,
                    borderRadius: 12, border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none",
                    background: "#fafafa", transition: "border 0.2s", fontFamily: "inherit"
                  }}
                  onFocus={e => e.target.style.borderColor = "#ff5a50"}
                  onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  {showPw ? <EyeOff style={{ width: 16, height: 16, color: "#94a3b8" }} /> : <Eye style={{ width: 16, height: 16, color: "#94a3b8" }} />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#374151" }}>
                <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: "#ff5a50", cursor: "pointer" }} />
                Ingat saya
              </label>
              <a href="/forgot-password" style={{ fontSize: 13, fontWeight: 700, color: "#ff5a50", textDecoration: "none" }}>Lupa kata sandi?</a>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{
                width: "100%", padding: "14px 0", borderRadius: 12, border: "none",
                background: loading ? "#fca5a5" : "linear-gradient(135deg, #ff5a50, #ff7760)",
                color: "#fff", fontSize: 15, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 6px 20px rgba(255,90,80,0.35)",
                transition: "all 0.2s"
              }}>
              {loading ? "Sedang masuk..." : "Masuk"}
            </button>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
              <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>atau</span>
              <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
            </div>

            {/* Google */}
            <button type="button" onClick={handleGoogleLogin}
              style={{
                width: "100%", padding: "12px 0", borderRadius: 12, border: "1.5px solid #e2e8f0",
                background: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "#374151",
                transition: "all 0.2s"
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "#ff5a50")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "#e2e8f0")}>
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Masuk dengan Google
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "#64748b" }}>
            Belum punya akun?{" "}
            <a href="/register" style={{ fontWeight: 700, color: "#ff5a50", textDecoration: "none" }}>Daftar</a>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, textAlign: "center", padding: "14px", fontSize: 11.5, color: "#94a3b8" }}>
        🔒 Keamanan data Anda adalah prioritas kami. &nbsp;•&nbsp; © 2025 Sistem Manajemen Klinik AI. Semua hak dilindungi.
      </div>
      {/* GOOGLE ACCOUNTS CHOOSER MODAL */}
      {showGoogleModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 400, padding: "28px 24px", boxShadow: "0 25px 50px rgba(0,0,0,0.25)", position: "relative" }}>
            
            {/* Google Logo & Title */}
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" style={{ margin: "0 auto 12px" }}>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1e293b", margin: "0 0 6px" }}>Pilih akun Google</h3>
              <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>untuk melanjutkan ke Sistem Klinik AI</p>
            </div>

            {/* List of accounts */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {/* Account 1 */}
              <button 
                type="button"
                onClick={() => handleGoogleDemoLogin("dokter@sehatsentosa.com", "dr. Maya Lestari", "Dokter", "Umum")}
                style={{ 
                  display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 14px", 
                  borderRadius: 14, border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", 
                  textAlign: "left", transition: "all 0.15s" 
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "#ff5a50";
                  e.currentTarget.style.background = "#fff5f4";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.background = "#fff";
                }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#ff5a50", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13 }}>
                  ML
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>dr. Maya Lestari</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>dokter@sehatsentosa.com</div>
                </div>
                <span style={{ background: "#fee2e2", color: "#ef4444", padding: "2px 8px", borderRadius: 8, fontSize: 9.5, fontWeight: 800 }}>Demo</span>
              </button>

              {/* Account 2 */}
              <button 
                type="button"
                onClick={() => handleGoogleDemoLogin("sari.dewi@sehatsentosa.com", "drg. Sari Dewi", "Dokter", "Gigi")}
                style={{ 
                  display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 14px", 
                  borderRadius: 14, border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", 
                  textAlign: "left", transition: "all 0.15s" 
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "#ff5a50";
                  e.currentTarget.style.background = "#fff5f4";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.background = "#fff";
                }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#8b5cf6", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13 }}>
                  SD
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>drg. Sari Dewi</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>sari.dewi@sehatsentosa.com</div>
                </div>
                <span style={{ background: "#fee2e2", color: "#ef4444", padding: "2px 8px", borderRadius: 8, fontSize: 9.5, fontWeight: 800 }}>Demo</span>
              </button>
            </div>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: "#f1f5f9" }} />
              <span style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 700 }}>ATAU</span>
              <div style={{ flex: 1, height: 1, background: "#f1f5f9" }} />
            </div>

            {/* Real OAuth Choice */}
            <button 
              type="button"
              onClick={handleRealGoogleOAuth}
              style={{ 
                width: "100%", padding: "11px 0", borderRadius: 12, border: "1.5px solid #cbd5e1", 
                background: "#f8fafc", color: "#475569", fontSize: 12.5, fontWeight: 700, cursor: "pointer", 
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.15s" 
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "#0d9488";
                e.currentTarget.style.color = "#0d9488";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "#cbd5e1";
                e.currentTarget.style.color = "#475569";
              }}>
              🔒 Gunakan Akun Google Lain (OAuth)
            </button>

            {/* Cancel Button */}
            <button 
              type="button"
              onClick={() => setShowGoogleModal(false)}
              style={{ 
                width: "100%", padding: "10px 0", borderRadius: 12, border: "none", 
                background: "transparent", color: "#94a3b8", fontSize: 12, fontWeight: 700, 
                cursor: "pointer", marginTop: 12, textAlign: "center" 
              }}>
              Batalkan
            </button>

          </div>
        </div>
      )}
    </div>
  );
}
