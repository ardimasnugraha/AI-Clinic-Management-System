"use client";

import React, { useState, useEffect } from "react";
import { 
  Settings, User, Bell, Shield, Database, Building2, Palette, Save, 
  ChevronRight, Lock, Globe, Smartphone, Plus, Stethoscope, Edit2, Trash2, Check, RefreshCw, AlertTriangle
} from "lucide-react";
import { Doctor, getStoredDoctors, saveStoredDoctors, addStoredDoctor, resetAllData } from "@/lib/store";
import { supabase } from "@/lib/supabase/client";

const Container = ({ style, ...p }: any) => (
  <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e8f0fe", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", ...style }} {...p} />
);

const sections = [
  { id: "profil", label: "Profil Klinik", icon: Building2, color: "#0d9488" },
  { id: "dokter", label: "Manajemen Dokter", icon: Stethoscope, color: "#8b5cf6" },
  { id: "keamanan", label: "Keamanan", icon: Shield, color: "#ef4444" },
  { id: "database", label: "Database & Reset Data", icon: Database, color: "#22c55e" },
  { id: "tampilan", label: "Tampilan", icon: Palette, color: "#3b82f6" },
];

const DOCTOR_PRESETS = [
  { name: "dr. Maya Lestari", poli: "Umum", sip: "SIP-2024-001", phone: "0812-1111-2222", color: "#0d9488" },
  { name: "drg. Sari Dewi", poli: "Gigi", sip: "SIP-2024-002", phone: "0812-3333-4444", color: "#8b5cf6" },
  { name: "dr. Ahmad Rizki", poli: "Jantung", sip: "SIP-2024-003", phone: "0812-5555-6666", color: "#f97316" },
  { name: "dr. Laila Rahmawati", poli: "Kulit", sip: "SIP-2024-004", phone: "0812-7777-8888", color: "#ec4899" },
  { name: "dr. Rudi Setiawan", poli: "Anak", sip: "SIP-2024-005", phone: "0812-9999-0000", color: "#22c55e" },
  { name: "dr. Hendra Kusuma", poli: "Mata", sip: "SIP-2024-006", phone: "0811-2233-4455", color: "#3b82f6" },
  { name: "dr. Bagus W.", poli: "Penyakit Dalam", sip: "SIP-2024-007", phone: "0811-3344-5566", color: "#0284c7" }
];

export default function SettingsView() {
  const [active, setActive] = useState("profil");
  const [saved, setSaved] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Form State for Add/Edit Doctor
  const [docForm, setDocForm] = useState({
    name: "",
    poli: "Umum",
    sip: "",
    phone: "",
    color: "#0d9488",
    status: "Aktif" as "Aktif" | "Cuti" | "Nonaktif"
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadDoctors = async () => {
    try {
      const { data, error } = await supabase.from("doctor_profiles").select("*").order("created_at", { ascending: false });
      if (!error && data) {
        const mappedDocs: Doctor[] = data.map((d: any) => ({
          id: d.doctor_id || d.id,
          name: d.full_name,
          poli: d.poli,
          sip: d.sip || "SIP-2026-001",
          phone: d.phone || "0812-0000-0000",
          color: d.color || "#0d9488",
          bg: d.color ? `${d.color}18` : "#e0f2fe",
          status: d.status || "Aktif"
        }));
        setDoctors(mappedDocs);
        saveStoredDoctors(mappedDocs);
      } else {
        setDoctors(getStoredDoctors());
      }
    } catch (e) {
      setDoctors(getStoredDoctors());
    }
  };

  useEffect(() => {
    // Load dark mode preference
    const savedDark = localStorage.getItem("clinic_dark_mode") === "true";
    setIsDarkMode(savedDark);
    if (savedDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    loadDoctors();

    async function loadPatients() {
      const { data, error } = await supabase.from("patients").select("*").order("medical_record_number", { ascending: true });
      if (!error) setPatients(data || []);
    }
    loadPatients();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUserEmail(user.email || "");
      }
    });
  }, []);

  const handleDeletePatient = async (rm: string) => {
    if (!confirm(`Yakin menghapus data pasien RM: ${rm} secara permanen?`)) return;
    try {
      const { error } = await supabase.from("patients").delete().eq("medical_record_number", rm);
      if (error) throw error;
      setPatients(p => p.filter(pat => pat.medical_record_number !== rm));
      showToast("Data Pasien berhasil dihapus dari Supabase.");
    } catch (e) {
      console.error(e);
      alert("Gagal menghapus pasien dari Supabase.");
    }
  };

  const handleToggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    localStorage.setItem("clinic_dark_mode", String(next));
    if (next) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    showToast(next ? "🌙 Mode Gelap diaktifkan" : "☀️ Mode Terang diaktifkan");
  };

  const handleSaveSettings = () => {
    setSaved(true);
    showToast("Pengaturan klinik berhasil disimpan.");
    setTimeout(() => setSaved(false), 2000);
  };

  const handleOpenAddDoctor = () => {
    setEditingDoctor(null);
    setDocForm({
      name: "",
      poli: "Umum",
      sip: `SIP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      phone: "",
      color: "#0d9488",
      status: "Aktif"
    });
    setShowAddDoctorModal(true);
  };

  const handleOpenEditDoctor = (doc: Doctor) => {
    setEditingDoctor(doc);
    setDocForm({
      name: doc.name,
      poli: doc.poli,
      sip: doc.sip || "",
      phone: doc.phone || "",
      color: doc.color || "#0d9488",
      status: doc.status || "Aktif"
    });
    setShowAddDoctorModal(true);
  };

  const handleDoctorFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docForm.name.trim()) {
      alert("Nama Dokter wajib diisi.");
      return;
    }

    if (editingDoctor) {
      // Edit existing doctor in Supabase & local
      const updated = doctors.map(d => {
        if (d.id === editingDoctor.id) {
          return {
            ...d,
            name: docForm.name,
            poli: docForm.poli,
            sip: docForm.sip,
            phone: docForm.phone,
            color: docForm.color,
            bg: `${docForm.color}18`,
            status: docForm.status
          };
        }
        return d;
      });
      setDoctors(updated);
      saveStoredDoctors(updated);

      try {
        await supabase.from("doctor_profiles").update({
          full_name: docForm.name,
          poli: docForm.poli,
          sip: docForm.sip,
          phone: docForm.phone,
          color: docForm.color,
          status: docForm.status
        }).or(`doctor_id.eq.${editingDoctor.id},id.eq.${editingDoctor.id}`);
      } catch (e) {}

      showToast(`Data ${docForm.name} berhasil diperbarui.`);
    } else {
      // Create new doctor in Supabase & local
      const nextDocId = `DOC${String(doctors.length + 1).padStart(3, "0")}`;
      const newDocItem: Doctor = {
        id: nextDocId,
        name: docForm.name,
        poli: docForm.poli,
        sip: docForm.sip || `SIP-${new Date().getFullYear()}-001`,
        phone: docForm.phone || "0812-0000-0000",
        color: docForm.color,
        bg: `${docForm.color}18`,
        status: docForm.status
      };

      try {
        await supabase.from("doctor_profiles").insert([{
          clinic_id: "11111111-1111-1111-1111-111111111111",
          doctor_id: nextDocId,
          full_name: docForm.name,
          poli: docForm.poli,
          sip: newDocItem.sip,
          phone: newDocItem.phone,
          color: docForm.color,
          status: docForm.status
        }]);
      } catch (e) {}

      const updated = [newDocItem, ...doctors];
      setDoctors(updated);
      saveStoredDoctors(updated);
      showToast(`Dokter Baru ${docForm.name} berhasil ditambahkan!`);
    }

    setShowAddDoctorModal(false);
  };

  const handleDeleteDoctor = async (id: string, name: string) => {
    if (!confirm(`Yakin ingin menghapus ${name} dari sistem?`)) return;
    const updated = doctors.filter(d => d.id !== id);
    setDoctors(updated);
    saveStoredDoctors(updated);

    try {
      await supabase.from("doctor_profiles").delete().or(`doctor_id.eq.${id},id.eq.${id}`);
    } catch (e) {}

    showToast(`Dokter ${name} berhasil dihapus.`);
  };

  const handleResetDataClick = () => {
    if (confirm("⚠️ PERHATIAN: Apakah Anda yakin ingin mengosongkan semua data sampel (Pasien, Appointment, Antrean, Encounter, Billing, dll) untuk memulai dari nol?\n\nTindakan ini tidak dapat dibatalkan.")) {
      resetAllData();
      showToast("Seluruh data sampel telah dibersihkan! Anda dapat mulai menginput data baru.");
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Toast Notification */}
      {toastMsg && (
        <div style={{ 
          position: "fixed", top: 24, right: 24, zIndex: 1100,
          background: "#0f172a", color: "#fff", padding: "12px 20px", borderRadius: 12,
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)", fontSize: 13, fontWeight: 600,
          display: "flex", alignItems: "center", gap: 10
        }}>
          <Check style={{ width: 18, height: 18, color: "#22c55e" }} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>Pengaturan System & Klinik</h1>
        <p style={{ fontSize: 13, color: "#64748b", margin: "2px 0 0" }}>Kelola profil klinik, manajemen dokter, notifikasi, dan konfigurasi database</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "230px 1fr", gap: 20, alignItems: "start" }}>
        {/* Sidebar */}
        <Container style={{ padding: 10, overflow: "hidden" }}>
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <button 
                key={s.id} 
                onClick={() => setActive(s.id)}
                style={{ 
                  width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", 
                  borderRadius: 12, border: "none", cursor: "pointer", textAlign: "left", marginBottom: 3,
                  background: active === s.id ? `${s.color}15` : "transparent",
                  color: active === s.id ? s.color : "#475569",
                  fontWeight: active === s.id ? 700 : 600, fontSize: 13, transition: "all 0.15s"
                }}>
                <Icon style={{ width: 16, height: 16, color: active === s.id ? s.color : "#94a3b8" }} />
                {s.label}
                {active === s.id && <ChevronRight style={{ width: 14, height: 14, marginLeft: "auto" }} />}
              </button>
            );
          })}
        </Container>

        {/* Main Content Pane */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* TAB 1: PROFIL KLINIK */}
          {active === "profil" && (
            <Container style={{ padding: 26 }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: "0 0 20px" }}>Profil Utama Klinik</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[
                  { label: "Nama Klinik", val: "Klinik Sehat Sentosa", ph: "Nama klinik..." },
                  { label: "Cabang", val: "Semarang - Pusat", ph: "Cabang..." },
                  { label: "Alamat Lengkap", val: "Jl. Pemuda No. 45, Semarang", ph: "Alamat..." },
                  { label: "No. Telepon Hotline", val: "(024) 8899-7766", ph: "No. telepon..." },
                  { label: "Email Resmi Klinik", val: "info@kliniksehat.co.id", ph: "Email..." },
                  { label: "Website", val: "www.kliniksehat.co.id", ph: "Website..." },
                  { label: "No. Izin Operasional", val: "IZN-2024-001/DINKES", ph: "No. izin..." },
                  { label: "Jam Operasional", val: "07:00 - 21:00 WIB (Senin - Sabtu)", ph: "Jam operasional..." },
                ].map((f, i) => (
                  <div key={i} style={{ gridColumn: i === 2 || i === 6 ? "1/-1" : "auto" }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>{f.label}</label>
                    <input 
                      defaultValue={f.val} 
                      placeholder={f.ph}
                      style={{ width: "100%", padding: "9.5px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8fafc", fontSize: 13, color: "#1e293b", outline: "none" }} 
                    />
                  </div>
                ))}
              </div>
            </Container>
          )}

          {/* TAB 2: MANAJEMEN DOKTER */}
          {active === "dokter" && (
            <Container style={{ padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: 0 }}>Daftar Praktik Dokter</h2>
                  <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>Kelola jadwal dokter pemeriksa, poli spesialisasi, dan nomor SIP</p>
                </div>

                {currentUserEmail.toLowerCase() === "admin@klinikai.co.id" && (
                  <button 
                    onClick={handleOpenAddDoctor}
                    style={{ display: "flex", alignItems: "center", gap: 6, background: "#0d9488", color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(13,148,136,0.25)" }}>
                    <Plus style={{ width: 16, height: 16 }} /> Tambah Dokter Baru
                  </button>
                )}
              </div>

              {/* Doctor List Cards / Table */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
                {doctors.map((doc) => (
                  <div key={doc.id} style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: doc.color || "#0d9488", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
                        {doc.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <h4 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: 0 }}>{doc.name}</h4>
                          <span style={{ background: "#dcfce7", color: "#15803d", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 10 }}>{doc.status}</span>
                        </div>
                        <p style={{ fontSize: 12, color: doc.color || "#0d9488", fontWeight: 700, margin: "2px 0 0" }}>Poli {doc.poli}</p>
                        <p style={{ fontSize: 11, color: "#64748b", margin: "2px 0 0" }}>{doc.sip || "SIP-2024-001"} • {doc.phone || "-"}</p>
                      </div>
                    </div>

                    {currentUserEmail.toLowerCase() === "admin@klinikai.co.id" && (
                      <div style={{ display: "flex", gap: 8, borderTop: "1px solid #e2e8f0", paddingTop: 10 }}>
                        <button 
                          onClick={() => handleOpenEditDoctor(doc)}
                          style={{ flex: 1, padding: "6px 0", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", fontSize: 11.5, fontWeight: 700, color: "#475569", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                          <Edit2 style={{ width: 12, height: 12 }} /> Edit Data
                        </button>
                        <button 
                          onClick={() => handleDeleteDoctor(doc.id, doc.name)}
                          style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #fecaca", background: "#fef2f2", fontSize: 11.5, fontWeight: 700, color: "#dc2626", cursor: "pointer" }}>
                          <Trash2 style={{ width: 12, height: 12 }} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Container>
          )}

          {/* TAB 5: DATABASE & RESET DATA */}
          {active === "database" && (
            <Container style={{ padding: 26 }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: "0 0 16px" }}>Database & Pembersihan Data</h2>

              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 14, padding: 18, marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <Database style={{ width: 20, height: 20, color: "#0d9488" }} />
                  <h4 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: 0 }}>Status Koneksi Database</h4>
                </div>
                <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
                  Aplikasi aktif menggunakan <strong>Supabase Cloud & Unified LocalStorage Store</strong>. Seluruh data transaksi tersimpan secara persisten.
                </p>
              </div>

              {/* Patient Data Management */}
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 18, marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <User style={{ width: 20, height: 20, color: "#0d9488" }} />
                  <h4 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: 0 }}>Data Pasien di Supabase</h4>
                </div>
                <div style={{ overflowX: "auto", maxHeight: 300 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                    <thead style={{ position: "sticky", top: 0, background: "#f8fafc", zIndex: 10 }}>
                      <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                        <th style={{ padding: "10px", textAlign: "left", fontWeight: 700, color: "#475569" }}>RM</th>
                        <th style={{ padding: "10px", textAlign: "left", fontWeight: 700, color: "#475569" }}>Nama Lengkap</th>
                        <th style={{ padding: "10px", textAlign: "left", fontWeight: 700, color: "#475569" }}>NIK</th>
                        <th style={{ padding: "10px", textAlign: "center", fontWeight: 700, color: "#475569" }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patients.map(p => (
                        <tr key={p.medical_record_number} style={{ borderBottom: "1px solid #e2e8f0" }}>
                          <td style={{ padding: "10px", color: "#0f172a", fontWeight: 600 }}>{p.medical_record_number}</td>
                          <td style={{ padding: "10px", color: "#334155" }}>{p.full_name}</td>
                          <td style={{ padding: "10px", color: "#64748b" }}>{p.nik}</td>
                          <td style={{ padding: "10px", textAlign: "center" }}>
                            <button 
                              onClick={() => handleDeletePatient(p.medical_record_number)}
                              style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #fecaca", background: "#fef2f2", fontSize: 11, fontWeight: 700, color: "#dc2626", cursor: "pointer" }}>
                              Hapus
                            </button>
                          </td>
                        </tr>
                      ))}
                      {patients.length === 0 && (
                        <tr>
                          <td colSpan={4} style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>Belum ada data pasien di Supabase.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Reset Data Danger Zone */}
              <div style={{ background: "#fff5f5", border: "1.5px solid #fecaca", borderRadius: 14, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <AlertTriangle style={{ width: 22, height: 22, color: "#dc2626" }} />
                  <h4 style={{ fontSize: 15, fontWeight: 800, color: "#991b1b", margin: 0 }}>Reset & Clean Data Sampel</h4>
                </div>
                <p style={{ fontSize: 12, color: "#7f1d1d", margin: "0 0 16px", lineHeight: 1.5 }}>
                  Klik tombol di bawah untuk <strong>membersihkan semua data transaksi contoh/sampel</strong> (Pasien, Appointment, Antrean, Encounter, Resep, dan Billing). Gunakan fitur ini jika Anda ingin memulai sistem ini dalam keadaan bersih murni dari nol untuk data klinik Anda.
                </p>
                <button 
                  onClick={handleResetDataClick}
                  style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 12px rgba(220,38,38,0.3)", display: "flex", alignItems: "center", gap: 8 }}>
                  <RefreshCw style={{ width: 15, height: 15 }} /> Bersihkan Semua Data Sampel
                </button>
              </div>
            </Container>
          )}

          {/* TAB 3 & 4: KEAMANAN & NOTIFIKASI */}
          {active === "keamanan" && (
            <Container style={{ padding: 26 }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: "0 0 20px" }}>Keamanan Sistem & Hak Akses</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { label: "Autentikasi Dua Faktor (2FA)", desc: "Wajibkan 2FA untuk semua staf klinik", enabled: true },
                  { label: "Session Timeout Otomatis", desc: "Logout otomatis setelah 30 menit tidak aktif", enabled: true },
                  { label: "Enkripsi Rekam Medis (AES-256)", desc: "Enkripsi data sensitis pasien di Supabase", enabled: true },
                  { label: "Log Audit Transaksi Keamanan", desc: "Catat semua aktivitas perubaham data", enabled: true },
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: 12, border: "1px solid #e8f0fe" }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: 0 }}>{s.label}</p>
                      <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>{s.desc}</p>
                    </div>
                    <span style={{ background: s.enabled ? "#dcfce7" : "#f1f5f9", color: s.enabled ? "#15803d" : "#64748b", fontSize: 11, fontWeight: 800, padding: "4px 12px", borderRadius: 20 }}>
                      {s.enabled ? "Aktif" : "Non-aktif"}
                    </span>
                  </div>
                ))}
              </div>
            </Container>
          )}



          {!["profil", "dokter", "database", "keamanan", "tampilan"].includes(active) && (
            <Container style={{ padding: 40, textAlign: "center" }}>
              <Settings style={{ width: 40, height: 40, color: "#94a3b8", margin: "0 auto 12px" }} />
              <p style={{ fontSize: 14, color: "#64748b", fontWeight: 600 }}>Pengaturan sedang disesuaikan...</p>
            </Container>
          )}

          {/* TAB TAMPILAN */}
          {active === "tampilan" && (
            <Container style={{ padding: 26, background: isDarkMode ? "#1e293b" : "#fff", border: isDarkMode ? "1px solid #334155" : undefined }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: isDarkMode ? "#f1f5f9" : "#0f172a", margin: "0 0 6px" }}>Tampilan</h2>
              <p style={{ fontSize: 12, color: isDarkMode ? "#94a3b8" : "#64748b", margin: "0 0 24px" }}>Sesuaikan tampilan antarmuka sistem klinik</p>

              {/* Dark Mode Toggle Card */}
              <div style={{
                background: isDarkMode ? "#0f172a" : "#f8fafc",
                border: `1.5px solid ${isDarkMode ? "#334155" : "#e2e8f0"}`,
                borderRadius: 16,
                padding: "20px 22px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                marginBottom: 16,
                transition: "all 0.3s ease"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: isDarkMode ? "linear-gradient(135deg, #1e3a5f, #0f2a4a)" : "linear-gradient(135deg, #fef3c7, #fde68a)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22, transition: "all 0.3s ease",
                    boxShadow: isDarkMode ? "0 4px 12px rgba(14,165,233,0.2)" : "0 4px 12px rgba(245,158,11,0.2)"
                  }}>
                    {isDarkMode ? "🌙" : "☀️"}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 800, color: isDarkMode ? "#f1f5f9" : "#0f172a", margin: 0 }}>
                      {isDarkMode ? "Mode Gelap (Dark Mode)" : "Mode Terang (Light Mode)"}
                    </p>
                    <p style={{ fontSize: 11.5, color: isDarkMode ? "#94a3b8" : "#64748b", margin: "2px 0 0" }}>
                      {isDarkMode
                        ? "Tampilan gelap aktif — nyaman untuk mata di malam hari"
                        : "Tampilan terang aktif — klik untuk beralih ke mode gelap"}
                    </p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  type="button"
                  onClick={handleToggleDarkMode}
                  style={{
                    width: 54, height: 30, borderRadius: 30,
                    background: isDarkMode ? "#0ea5e9" : "#cbd5e1",
                    border: "none", cursor: "pointer", position: "relative",
                    transition: "background 0.3s ease",
                    flexShrink: 0,
                    boxShadow: isDarkMode ? "0 0 12px rgba(14,165,233,0.5)" : "none"
                  }}
                  title={isDarkMode ? "Matikan Dark Mode" : "Aktifkan Dark Mode"}
                >
                  <span style={{
                    position: "absolute", top: 3,
                    left: isDarkMode ? 27 : 3,
                    width: 24, height: 24, borderRadius: "50%",
                    background: "#fff",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                    transition: "left 0.3s cubic-bezier(0.34,1.56,0.64,1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12
                  }}>
                    {isDarkMode ? "🌙" : "☀️"}
                  </span>
                </button>
              </div>

              {/* Info Banner */}
              <div style={{
                background: isDarkMode ? "rgba(14,165,233,0.1)" : "#eff6ff",
                border: `1px solid ${isDarkMode ? "rgba(14,165,233,0.3)" : "#bfdbfe"}`,
                borderRadius: 12, padding: "12px 16px",
                display: "flex", alignItems: "center", gap: 10
              }}>
                <span style={{ fontSize: 18 }}>ℹ️</span>
                <p style={{ fontSize: 12, color: isDarkMode ? "#7dd3fc" : "#1d4ed8", margin: 0, fontWeight: 600 }}>
                  Preferensi tampilan disimpan otomatis di perangkat ini dan berlaku saat Anda login kembali.
                </p>
              </div>
            </Container>
          )}

          {/* Save Footer */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={handleSaveSettings} style={{ display: "flex", alignItems: "center", gap: 8, background: saved ? "#22c55e" : "#0d9488", color: "#fff", border: "none", borderRadius: 12, padding: "12px 28px", fontSize: 13.5, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 12px rgba(13,148,136,0.3)" }}>
              <Save style={{ width: 16, height: 16 }} />
              {saved ? "✓ Tersimpan!" : "Simpan Pengaturan"}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL TAMBAH / EDIT DOKTER */}
      {showAddDoctorModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <Container style={{ width: 460, padding: 26, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  {editingDoctor ? "Edit Data Dokter" : "Tambah Dokter Baru"}
                </h2>
                <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 12px" }}>Daftarkan tenaga medis dan tentukan poli spesialisasi</p>
                {!editingDoctor && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Pilih Cepat Dokter Terdaftar:</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {DOCTOR_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => setDocForm({
                            name: preset.name,
                            poli: preset.poli,
                            sip: preset.sip,
                            phone: preset.phone,
                            color: preset.color,
                            status: "Aktif"
                          })}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "6px 10px",
                            borderRadius: 12,
                            border: `1.5px solid ${docForm.name === preset.name ? preset.color : "#e2e8f0"}`,
                            background: docForm.name === preset.name ? `${preset.color}15` : "#fff",
                            color: docForm.name === preset.name ? preset.color : "#475569",
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: "pointer",
                            transition: "all 0.15s"
                          }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: preset.color }} />
                          {preset.name.split(". ")[1] || preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button onClick={() => setShowAddDoctorModal(false)} style={{ border: "none", background: "#f1f5f9", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13, color: "#64748b", fontWeight: 700 }}>✕</button>
            </div>

            <form onSubmit={handleDoctorFormSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Doctor Name */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>
                  Nama Lengkap Dokter & Gelar <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input 
                  type="text" 
                  required
                  value={docForm.name}
                  onChange={e => setDocForm({ ...docForm, name: e.target.value })}
                  placeholder="Contoh: dr. Maya Lestari, Sp.PD"
                  style={{ width: "100%", padding: "9.5px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13, color: "#1e293b", outline: "none" }} 
                />
              </div>

              {/* Poli Selection */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>
                    Poli / Spesialisasi
                  </label>
                  <select 
                    value={docForm.poli}
                    onChange={e => setDocForm({ ...docForm, poli: e.target.value })}
                    style={{ width: "100%", padding: "9.5px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13, color: "#1e293b", outline: "none" }}>
                    <option value="Umum">Poli Umum</option>
                    <option value="Gigi">Poli Gigi</option>
                    <option value="Jantung">Poli Jantung</option>
                    <option value="Mata">Poli Mata</option>
                    <option value="Kulit">Poli Kulit</option>
                    <option value="Anak">Poli Anak</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>
                    Status Praktik
                  </label>
                  <select 
                    value={docForm.status}
                    onChange={e => setDocForm({ ...docForm, status: e.target.value as any })}
                    style={{ width: "100%", padding: "9.5px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13, color: "#1e293b", outline: "none" }}>
                    <option value="Aktif">Aktif Praktik</option>
                    <option value="Cuti">Sedang Cuti</option>
                    <option value="Nonaktif">Non-aktif</option>
                  </select>
                </div>
              </div>

              {/* SIP Number */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>
                  Nomor Surat Izin Praktik (SIP)
                </label>
                <input 
                  type="text" 
                  value={docForm.sip}
                  onChange={e => setDocForm({ ...docForm, sip: e.target.value })}
                  placeholder="SIP-2024-xxx"
                  style={{ width: "100%", padding: "9.5px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13, color: "#1e293b", outline: "none" }} 
                />
              </div>

              {/* Phone */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>
                  Nomor HP Dokter
                </label>
                <input 
                  type="text" 
                  value={docForm.phone}
                  onChange={e => setDocForm({ ...docForm, phone: e.target.value })}
                  placeholder="0812-xxxx-xxxx"
                  style={{ width: "100%", padding: "9.5px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13, color: "#1e293b", outline: "none" }} 
                />
              </div>

              {/* Tag Color */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>
                  Warna Identitas Tag Dokter
                </label>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  {["#0d9488", "#8b5cf6", "#f97316", "#3b82f6", "#ec4899", "#22c55e"].map(c => (
                    <div 
                      key={c}
                      onClick={() => setDocForm({ ...docForm, color: c })}
                      style={{ 
                        width: 28, height: 28, borderRadius: "50%", background: c, cursor: "pointer",
                        border: docForm.color === c ? "3px solid #0f172a" : "2px solid #fff",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.15)"
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowAddDoctorModal(false)} 
                  style={{ flex: 1, padding: "10.5px 0", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 700, color: "#64748b", cursor: "pointer" }}>
                  Batal
                </button>
                <button type="submit" 
                  style={{ flex: 2, padding: "10.5px 0", borderRadius: 10, border: "none", background: "#0d9488", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", boxShadow: "0 4px 12px rgba(13,148,136,0.3)" }}>
                  {editingDoctor ? "Simpan Dokter" : "Tambah Dokter"}
                </button>
              </div>
            </form>
          </Container>
        </div>
      )}
    </div>
  );
}
