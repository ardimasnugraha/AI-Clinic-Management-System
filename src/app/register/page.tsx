"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, Building2, Phone, Users, Activity, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const ROLES = ["Admin Klinik", "Dokter", "Perawat", "Apoteker", "Kasir", "Resepsionis"];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "", clinicName: "", email: "", phone: "",
    password: "", confirmPassword: "", role: "Admin Klinik"
  });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const setField = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password.length < 8) { setError("Kata sandi minimal 8 karakter."); return; }
    if (form.password !== form.confirmPassword) { setError("Konfirmasi kata sandi tidak cocok."); return; }
    if (!agree) { setError("Anda harus menyetujui Syarat & Ketentuan."); return; }
    setLoading(true);
    try {
      const { error: authErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.fullName, clinic_name: form.clinicName, phone: form.phone, role: form.role }
        }
      });
      if (authErr) {
        setError(authErr.message === "User already registered" ? "Email ini sudah terdaftar. Silakan masuk." : authErr.message);
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
  };

  const features = [
    { icon: Users, color: "#0d9488", bg: "#e0f9f6", title: "Manajemen Pasien", desc: "Kelola data pasien, appointment, rekam medis, dan antrian dengan mudah." },
    { icon: Activity, color: "#8b5cf6", bg: "#ede9fe", title: "AI Clinical Assistant", desc: "Dapatkan insight, ringkasan klinis, dan rekomendasi berbasis AI." },
    { icon: ShieldCheck, color: "#f59e0b", bg: "#fef3c7", title: "Keamanan Data", desc: "Data klinik Anda terlindungi dengan enkripsi dan standar keamanan tinggi." },
  ];

  if (success) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #fdf8f5, #fef2ee)", fontFamily: "'Inter', sans-serif" }}>
        <div style={{ background: "#fff", borderRadius: 24, padding: 48, maxWidth: 440, width: "100%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.1)" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <span style={{ fontSize: 32 }}>✅</span>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", marginBottom: 8 }}>Pendaftaran Berhasil!</h2>
          <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7, marginBottom: 28 }}>
            Kami telah mengirimkan email konfirmasi ke <strong>{form.email}</strong>. Silakan periksa inbox Anda dan klik tautan konfirmasi untuk mengaktifkan akun.
          </p>
          <button onClick={() => router.push("/login")}
            style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #ff5a50, #ff7760)", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
            Lanjut ke Halaman Masuk
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #fdf8f5 0%, #fef2ee 50%, #fdf6fd 100%)",
      fontFamily: "'Inter', system-ui, sans-serif", padding: "20px"
    }}>
      <div style={{
        width: "100%", maxWidth: 1020, display: "grid", gridTemplateColumns: "1fr 1fr",
        background: "#fff", borderRadius: 28, overflow: "hidden",
        boxShadow: "0 32px 80px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.06)"
      }}>

        {/* LEFT PANEL */}
        <div style={{
          background: "linear-gradient(160deg, #fff9f7 0%, #fff5f0 100%)",
          padding: "48px 44px", display: "flex", flexDirection: "column", justifyContent: "space-between",
          borderRight: "1px solid #fde8df", position: "relative", overflow: "hidden"
        }}>
          <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,90,80,0.06)" }} />
          <div style={{ position: "absolute", bottom: 40, left: -40, width: 150, height: 150, borderRadius: "50%", background: "rgba(13,148,136,0.06)" }} />

          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#ff5a50"/>
                <path d="M10.5 10.5h3v3h3v3h-3v3h-3v-3h-3v-3h3v-3z" fill="#fff"/>
              </svg>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#0f172a", lineHeight: 1.2 }}>Sistem Manajemen</div>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#ff5a50", lineHeight: 1.2 }}>Klinik AI</div>
              </div>
            </div>

            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fff4f2", border: "1px solid #ffd4cf", borderRadius: 20, padding: "5px 14px", marginBottom: 24 }}>
              <span style={{ fontSize: 14 }}>✨</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#e04939" }}>Mulai sekarang</span>
            </div>

            <h1 style={{ fontSize: 30, fontWeight: 900, color: "#0f172a", lineHeight: 1.25, marginBottom: 12 }}>
              Buat akun klinik Anda
            </h1>
            <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7, marginBottom: 36 }}>
              Bergabunglah dengan ribuan klinik yang percaya pada teknologi AI untuk mengelola operasional, pasien, dan data klinik dengan lebih efisien dan aman.
            </p>

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
          <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
            <svg width="180" height="150" viewBox="0 0 200 170" fill="none">
              <ellipse cx="100" cy="155" rx="70" ry="12" fill="#fde8df" opacity="0.5"/>
              <rect x="70" y="85" width="60" height="70" rx="20" fill="#e8f5e9"/>
              <rect x="75" y="90" width="50" height="60" rx="18" fill="#a5d6a7"/>
              <circle cx="100" cy="68" r="22" fill="#ffd180"/>
              <circle cx="93" cy="66" r="2" fill="#5d4037"/>
              <circle cx="107" cy="66" r="2" fill="#5d4037"/>
              <path d="M94 74 Q100 80 106 74" stroke="#5d4037" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
              <path d="M78 62 Q80 46 100 46 Q120 46 122 62 Q115 54 100 54 Q85 54 78 62z" fill="#5d4037"/>
              <rect x="55" y="95" width="18" height="30" rx="9" fill="#a5d6a7"/>
              <rect x="127" y="95" width="18" height="30" rx="9" fill="#a5d6a7"/>
              <rect x="120" y="104" width="28" height="22" rx="4" fill="#e3f2fd" stroke="#90caf9" strokeWidth="1.5"/>
              <line x1="124" y1="111" x2="144" y2="111" stroke="#90caf9" strokeWidth="1"/>
              <line x1="124" y1="115" x2="140" y2="115" stroke="#90caf9" strokeWidth="1"/>
              <line x1="124" y1="119" x2="136" y2="119" stroke="#90caf9" strokeWidth="1"/>
              <ellipse cx="30" cy="148" rx="18" ry="10" fill="#c8e6c9"/>
              <ellipse cx="170" cy="148" rx="18" ry="10" fill="#c8e6c9"/>
              <path d="M155 50 L157 55 L162 57 L157 59 L155 64 L153 59 L148 57 L153 55 Z" fill="#ffb74d" opacity="0.8"/>
              <path d="M38 76 L39.5 80 L43 81.5 L39.5 83 L38 87 L36.5 83 L33 81.5 L36.5 80 Z" fill="#ff8a65" opacity="0.7"/>
            </svg>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ padding: "40px 44px", display: "flex", flexDirection: "column", justifyContent: "center", overflowY: "auto", maxHeight: "100vh" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#ff5a50"/>
              <path d="M10.5 10.5h3v3h3v3h-3v3h-3v-3h-3v-3h3v-3z" fill="#fff"/>
            </svg>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#0f172a" }}>Sistem Manajemen</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#ff5a50" }}>Klinik AI</div>
            </div>
          </div>

          <h2 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", marginBottom: 4 }}>Daftar akun baru</h2>
          <p style={{ fontSize: 12.5, color: "#64748b", marginBottom: 24 }}>Lengkapi data berikut untuk mulai menggunakan sistem</p>

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 12.5, color: "#dc2626", fontWeight: 600 }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Nama Lengkap */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 5 }}>Nama Lengkap</label>
              <div style={{ position: "relative" }}>
                <User style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "#94a3b8" }} />
                <input type="text" required placeholder="Masukkan nama lengkap Anda"
                  value={form.fullName} onChange={e => setField("fullName", e.target.value)}
                  style={{ width: "100%", paddingLeft: 38, paddingRight: 14, paddingTop: 10, paddingBottom: 10, borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 12.5, outline: "none", background: "#fafafa", fontFamily: "inherit" }}
                  onFocus={e => e.target.style.borderColor = "#ff5a50"}
                  onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                />
              </div>
            </div>

            {/* Nama Klinik */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 5 }}>Nama Klinik</label>
              <div style={{ position: "relative" }}>
                <Building2 style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "#94a3b8" }} />
                <input type="text" required placeholder="Masukkan nama klinik Anda"
                  value={form.clinicName} onChange={e => setField("clinicName", e.target.value)}
                  style={{ width: "100%", paddingLeft: 38, paddingRight: 14, paddingTop: 10, paddingBottom: 10, borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 12.5, outline: "none", background: "#fafafa", fontFamily: "inherit" }}
                  onFocus={e => e.target.style.borderColor = "#ff5a50"}
                  onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                />
              </div>
            </div>

            {/* Email + Phone Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 5 }}>Email</label>
                <div style={{ position: "relative" }}>
                  <Mail style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "#94a3b8" }} />
                  <input type="email" required placeholder="nama@klinik.co.id"
                    value={form.email} onChange={e => setField("email", e.target.value)}
                    style={{ width: "100%", paddingLeft: 38, paddingRight: 10, paddingTop: 10, paddingBottom: 10, borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 12.5, outline: "none", background: "#fafafa", fontFamily: "inherit" }}
                    onFocus={e => e.target.style.borderColor = "#ff5a50"}
                    onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 5 }}>No. HP</label>
                <div style={{ position: "relative" }}>
                  <Phone style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "#94a3b8" }} />
                  <input type="tel" placeholder="08xxxxxxxxxx"
                    value={form.phone} onChange={e => setField("phone", e.target.value)}
                    style={{ width: "100%", paddingLeft: 38, paddingRight: 10, paddingTop: 10, paddingBottom: 10, borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 12.5, outline: "none", background: "#fafafa", fontFamily: "inherit" }}
                    onFocus={e => e.target.style.borderColor = "#ff5a50"}
                    onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 5 }}>Kata Sandi</label>
              <div style={{ position: "relative" }}>
                <Lock style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "#94a3b8" }} />
                <input type={showPw ? "text" : "password"} required placeholder="Minimal 8 karakter"
                  value={form.password} onChange={e => setField("password", e.target.value)}
                  style={{ width: "100%", paddingLeft: 38, paddingRight: 40, paddingTop: 10, paddingBottom: 10, borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 12.5, outline: "none", background: "#fafafa", fontFamily: "inherit" }}
                  onFocus={e => e.target.style.borderColor = "#ff5a50"}
                  onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  {showPw ? <EyeOff style={{ width: 15, height: 15, color: "#94a3b8" }} /> : <Eye style={{ width: 15, height: 15, color: "#94a3b8" }} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 5 }}>Konfirmasi Kata Sandi</label>
              <div style={{ position: "relative" }}>
                <Lock style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "#94a3b8" }} />
                <input type={showConfirm ? "text" : "password"} required placeholder="Masukkan ulang kata sandi"
                  value={form.confirmPassword} onChange={e => setField("confirmPassword", e.target.value)}
                  style={{ width: "100%", paddingLeft: 38, paddingRight: 40, paddingTop: 10, paddingBottom: 10, borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 12.5, outline: "none", background: "#fafafa", fontFamily: "inherit" }}
                  onFocus={e => e.target.style.borderColor = "#ff5a50"}
                  onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  {showConfirm ? <EyeOff style={{ width: 15, height: 15, color: "#94a3b8" }} /> : <Eye style={{ width: 15, height: 15, color: "#94a3b8" }} />}
                </button>
              </div>
            </div>

            {/* Role */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 5 }}>Peran</label>
              <div style={{ position: "relative" }}>
                <User style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "#94a3b8" }} />
                <select value={form.role} onChange={e => setField("role", e.target.value)}
                  style={{ width: "100%", paddingLeft: 38, paddingRight: 14, paddingTop: 10, paddingBottom: 10, borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 12.5, outline: "none", background: "#fafafa", fontFamily: "inherit", cursor: "pointer", appearance: "none" }}>
                  {ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
                <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>▾</div>
              </div>
            </div>

            {/* Terms */}
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
              <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: "#ff5a50", marginTop: 1, flexShrink: 0, cursor: "pointer" }} />
              <span style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
                Saya menyetujui{" "}
                <a href="#" style={{ color: "#ff5a50", fontWeight: 700, textDecoration: "none" }}>Syarat & Ketentuan</a>
                {" "}dan{" "}
                <a href="#" style={{ color: "#ff5a50", fontWeight: 700, textDecoration: "none" }}>Kebijakan Privasi</a>
              </span>
            </label>

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{
                width: "100%", padding: "13px 0", borderRadius: 12, border: "none",
                background: loading ? "#fca5a5" : "linear-gradient(135deg, #ff5a50, #ff7760)",
                color: "#fff", fontSize: 14, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 6px 20px rgba(255,90,80,0.3)"
              }}>
              {loading ? "Mendaftarkan..." : "Daftar Sekarang"}
            </button>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
              <span style={{ fontSize: 11.5, color: "#94a3b8", fontWeight: 600 }}>atau</span>
              <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
            </div>

            {/* Google */}
            <button type="button" onClick={handleGoogleRegister}
              style={{
                width: "100%", padding: "11px 0", borderRadius: 12, border: "1.5px solid #e2e8f0",
                background: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "#374151"
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "#ff5a50")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "#e2e8f0")}>
              <svg width="17" height="17" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Daftar dengan Google
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 18, fontSize: 12.5, color: "#64748b" }}>
            Sudah punya akun?{" "}
            <a href="/login" style={{ fontWeight: 700, color: "#ff5a50", textDecoration: "none" }}>Masuk</a>
          </p>
        </div>
      </div>

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, textAlign: "center", padding: "12px", fontSize: 11, color: "#94a3b8" }}>
        🔒 Keamanan data Anda adalah prioritas kami. &nbsp;•&nbsp; © 2025 Sistem Manajemen Klinik AI. Semua hak dilindungi.
      </div>
    </div>
  );
}
