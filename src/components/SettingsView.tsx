"use client";

import React, { useState, useEffect } from "react";
import { 
  Settings, User, Bell, Shield, Database, Building2, Palette, Save, 
  ChevronRight, Lock, Globe, Smartphone, Plus, Stethoscope, Edit2, Trash2, Check, RefreshCw, AlertTriangle, Search, Eye, Phone, Mail, MapPin, Calendar, ShieldCheck
} from "lucide-react";
import { 
  Doctor, getStoredDoctors, saveStoredDoctors, addStoredDoctor, resetAllData,
  ClinicProfile, defaultClinicProfile, getClinicProfile, saveClinicProfile,
  SecuritySettings, defaultSecuritySettings, getSecuritySettings, saveSecuritySettings
} from "@/lib/store";
import { supabase, isConfigured } from "@/lib/supabase/client";

const Container = ({ style, ...p }: any) => (
  <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e8f0fe", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", ...style }} {...p} />
);

const sections = [
  { id: "profil", label: "Profil Klinik", icon: Building2, color: "#0d9488" },
  { id: "dokter", label: "Manajemen Dokter", icon: Stethoscope, color: "#8b5cf6" },
  { id: "keamanan", label: "Keamanan", icon: Shield, color: "#ef4444" },
  { id: "database", label: "Database & Reset Data", icon: Database, color: "#22c55e" },
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
  const [currentUserRole, setCurrentUserRole] = useState<string>("");

  // Supabase Patient Search & Modal States
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedDbPatient, setSelectedDbPatient] = useState<any | null>(null);
  const [showAddDbPatientModal, setShowAddDbPatientModal] = useState(false);
  const [newDbPatient, setNewDbPatient] = useState({
    fullName: "",
    nik: "",
    dob: "",
    gender: "Laki-laki",
    phone: "",
    email: "",
    address: "",
    insurance: "BPJS Kesehatan"
  });

  const isAdmin = 
    currentUserRole.toLowerCase().includes("admin") || 
    currentUserEmail.toLowerCase().includes("admin") || 
    currentUserEmail.toLowerCase() === "admin@klinikai.co.id";

  // Profil Klinik State
  const [profileForm, setProfileForm] = useState<ClinicProfile>(defaultClinicProfile);

  // Security Settings State
  const [securityForm, setSecurityForm] = useState<SecuritySettings>(defaultSecuritySettings);

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

  const loadPatients = async () => {
    try {
      const { data, error } = await supabase.from("patients").select("*").order("created_at", { ascending: false });
      if (!error && data) {
        setPatients(data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    // Load persisted clinic profile & security settings
    setProfileForm(getClinicProfile());
    setSecurityForm(getSecuritySettings());

    loadDoctors();
    loadPatients();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const email = user.email || "";
        const role = user.user_metadata?.role || (email.toLowerCase().includes("admin") ? "Admin Klinik" : "Dokter");
        setCurrentUserEmail(email);
        setCurrentUserRole(role);
      }
    });

    // Supabase Real-time Listener on 'patients' table
    let patientChannel: any = null;
    if (isConfigured) {
      patientChannel = supabase
        .channel("settings-realtime-patients")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "patients" },
          () => {
            loadPatients();
          }
        )
        .subscribe();
    }

    return () => {
      if (patientChannel) {
        supabase.removeChannel(patientChannel);
      }
    };
  }, []);

  const handleRefreshPatients = async () => {
    await loadPatients();
    showToast("🔄 Data pasien Supabase berhasil diperbarui secara live.");
  };

  const handleAddPatientToSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDbPatient.fullName.trim()) {
      alert("Nama Lengkap pasien wajib diisi.");
      return;
    }

    const nextRmNum = patients.length + 180;
    const newRm = `RM000${nextRmNum}`;

    try {
      const { error } = await supabase.from("patients").insert([{
        clinic_id: "11111111-1111-1111-1111-111111111111",
        medical_record_number: newRm,
        full_name: newDbPatient.fullName,
        date_of_birth: newDbPatient.dob || "2000-01-01",
        sex_at_birth: newDbPatient.gender,
        phone: newDbPatient.phone || "-",
        nik: newDbPatient.nik || "-",
        email: newDbPatient.email || "-",
        address: newDbPatient.address || "-",
        insurance: newDbPatient.insurance || "Umum",
        status: "active"
      }]);

      if (error) throw error;

      showToast(`✅ Pasien ${newDbPatient.fullName} (${newRm}) berhasil ditambahkan ke database Supabase!`);
      setShowAddDbPatientModal(false);
      setNewDbPatient({ fullName: "", nik: "", dob: "", gender: "Laki-laki", phone: "", email: "", address: "", insurance: "BPJS Kesehatan" });
      await loadPatients();
    } catch (err: any) {
      console.error(err);
      alert(`Gagal menyimpan data pasien ke Supabase: ${err.message || err}`);
    }
  };

  const handleDeletePatient = async (rm: string, name: string = "") => {
    if (!isAdmin) {
      alert("🔒 Akses Ditolak: Anda masuk sebagai Dokter. Hanya Administrator Klinik yang dapat menghapus data pasien dari database.");
      return;
    }
    if (!confirm(`⚠️ PERHATIAN: Yakin menghapus data pasien ${name ? name + ' ' : ''}(RM: ${rm}) secara permanen dari database Supabase?`)) return;
    try {
      const { error } = await supabase.from("patients").delete().eq("medical_record_number", rm);
      if (error) throw error;

      // Clean local storage cache if patient exists there
      try {
        const localData = localStorage.getItem("clinic_patients_v1");
        if (localData) {
          const localPatients = JSON.parse(localData);
          const filtered = localPatients.filter((p: any) => p.rm !== rm);
          localStorage.setItem("clinic_patients_v1", JSON.stringify(filtered));
        }
      } catch (e) {}

      setPatients(p => p.filter(pat => pat.medical_record_number !== rm));
      if (selectedDbPatient?.medical_record_number === rm) setSelectedDbPatient(null);
      showToast(`✅ Data Pasien ${name || rm} berhasil dihapus dari database Supabase.`);
    } catch (e) {
      console.error(e);
      alert("Gagal menghapus pasien dari Supabase.");
    }
  };

  const filteredDbPatients = patients.filter(p => {
    const query = patientSearch.trim().toLowerCase();
    if (!query) return true;
    const name = (p.full_name || "").toLowerCase();
    const rm = (p.medical_record_number || "").toLowerCase();
    const nik = (p.nik || "").toLowerCase();
    const phone = (p.phone || "").toLowerCase();
    return name.includes(query) || rm.includes(query) || nik.includes(query) || phone.includes(query);
  });

  const handleSaveSettings = () => {
    saveClinicProfile(profileForm);
    saveSecuritySettings(securityForm);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("clinic_profile_updated"));
    }
    setSaved(true);
    showToast("✓ Pengaturan klinik berhasil disimpan & diperbarui secara real-time!");
    setTimeout(() => setSaved(false), 2500);
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

  const handleResetDataClick = async () => {
    if (!isAdmin) {
      alert("🔒 Akses Ditolak: Anda masuk sebagai Dokter. Hanya Administrator Klinik yang memiliki hak akses untuk memicu pembersihan database & reset data sampel.");
      return;
    }
    if (confirm("⚠️ PERHATIAN ADMINISTRATOR: Apakah Anda yakin ingin mengosongkan semua data sampel (Pasien, Appointment, Antrean, Encounter, Billing, dll)?\n\nTindakan ini akan menghapus data sampel dari database & penyimpanan lokal secara permanen.")) {
      await resetAllData();
      showToast("✅ Seluruh data sampel berhasil dibersihkan dari database & penyimpanan lokal!");
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
                  { label: "Nama Klinik", key: "namaKlinik", val: profileForm.namaKlinik, ph: "Nama klinik..." },
                  { label: "Cabang", key: "cabang", val: profileForm.cabang, ph: "Cabang..." },
                  { label: "Alamat Lengkap", key: "alamat", val: profileForm.alamat, ph: "Alamat..." },
                  { label: "No. Telepon Hotline", key: "phone", val: profileForm.phone, ph: "No. telepon..." },
                  { label: "Email Resmi Klinik", key: "email", val: profileForm.email, ph: "Email..." },
                  { label: "Website", key: "website", val: profileForm.website, ph: "Website..." },
                  { label: "No. Izin Operasional", key: "noIzin", val: profileForm.noIzin, ph: "No. izin..." },
                  { label: "Jam Operasional", key: "jamOperasional", val: profileForm.jamOperasional, ph: "Jam operasional..." },
                ].map((f, i) => (
                  <div key={f.key} style={{ gridColumn: i === 2 || i === 6 ? "1/-1" : "auto" }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>{f.label}</label>
                    <input 
                      value={f.val} 
                      onChange={(e) => setProfileForm({ ...profileForm, [f.key]: e.target.value })}
                      placeholder={f.ph}
                      style={{ width: "100%", padding: "9.5px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#ffffff", fontSize: 13, color: "#1e293b", outline: "none" }} 
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

                {isAdmin && (
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

                    {isAdmin && (
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
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: 0 }}>Database & Pembersihan Data</h2>
                  <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>Kelola koneksi database Supabase dan operasi pembersihan data sampel klinik.</p>
                </div>
                <button
                  onClick={handleRefreshPatients}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", color: "#334155", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  <RefreshCw style={{ width: 14, height: 14, color: "#0d9488" }} /> Refresh Data Database
                </button>
              </div>

              {/* Security Restricted Access Banner for Non-Admin / Doctors */}
              {!isAdmin && (
                <div style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: 14, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
                  <Lock style={{ width: 22, height: 22, color: "#2563eb", flexShrink: 0 }} />
                  <div>
                    <strong style={{ fontSize: 13, color: "#1e40af", display: "block", marginBottom: 2 }}>Akses Terbatas: Mode Dokter (Non-Admin)</strong>
                    <p style={{ fontSize: 12, color: "#1e3a8a", margin: 0, lineHeight: 1.4 }}>
                      Fitur pembersihan data dan pengurusan database hanya dapat dieksekusi oleh <strong>Admin Klinik</strong>. Akun Anda terdeteksi sebagai Dokter, sehingga fitur hapus dan reset data dikunci untuk keamanan database klinik.
                    </p>
                  </div>
                </div>
              )}

              {/* Status Koneksi Database Card */}
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 14, padding: 18, marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Database style={{ width: 20, height: 20, color: "#0d9488" }} />
                    <h4 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: 0 }}>Status Koneksi Database</h4>
                  </div>
                  <span style={{ background: isConfigured ? "#dcfce7" : "#fef3c7", color: isConfigured ? "#15803d" : "#b45309", padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 800 }}>
                    {isConfigured ? "🟢 Supabase Cloud Online" : "🟡 Storage Lokal Active"}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                  Aplikasi aktif menggunakan <strong>Supabase Cloud Database</strong> & <strong>Unified LocalStorage Store</strong>. Tersimpan <strong>{patients.length} data pasien</strong> secara persisten di database.
                </p>
              </div>

              {/* Patient Data Management */}
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 18, marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <User style={{ width: 20, height: 20, color: "#0d9488" }} />
                    <h4 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: 0 }}>Data Pasien di Supabase</h4>
                    <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 800 }}>
                      {filteredDbPatients.length} / {patients.length} Pasien
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ position: "relative", width: 220 }}>
                      <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#94a3b8" }} />
                      <input 
                        type="text"
                        value={patientSearch}
                        onChange={e => setPatientSearch(e.target.value)}
                        placeholder="Cari RM, nama, NIK..."
                        style={{ width: "100%", paddingLeft: 30, paddingRight: 10, paddingTop: 6, paddingBottom: 6, borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 11.5, outline: "none" }}
                      />
                    </div>
                    <button
                      onClick={() => setShowAddDbPatientModal(true)}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8, border: "none", background: "#0d9488", color: "#fff", fontSize: 11.5, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 6px rgba(13,148,136,0.2)" }}>
                      <Plus style={{ width: 14, height: 14 }} /> Tambah Pasien Supabase
                    </button>
                  </div>
                </div>

                <div style={{ overflowX: "auto", maxHeight: 340 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead style={{ position: "sticky", top: 0, background: "#f8fafc", zIndex: 10 }}>
                      <tr style={{ borderBottom: "1.5px solid #e2e8f0", color: "#475569" }}>
                        <th style={{ padding: "10px", textAlign: "left", fontWeight: 700 }}>RM</th>
                        <th style={{ padding: "10px", textAlign: "left", fontWeight: 700 }}>Nama Lengkap</th>
                        <th style={{ padding: "10px", textAlign: "left", fontWeight: 700 }}>NIK</th>
                        <th style={{ padding: "10px", textAlign: "left", fontWeight: 700 }}>Tgl Lahir / Sex</th>
                        <th style={{ padding: "10px", textAlign: "left", fontWeight: 700 }}>No. HP</th>
                        <th style={{ padding: "10px", textAlign: "center", fontWeight: 700 }}>Status</th>
                        <th style={{ padding: "10px", textAlign: "center", fontWeight: 700 }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody style={{ color: "#334155" }}>
                      {filteredDbPatients.map(p => (
                        <tr key={p.medical_record_number || p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "10px" }}>
                            <span style={{ background: "#f0fdf4", color: "#166534", padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 800, fontFamily: "monospace" }}>
                              {p.medical_record_number}
                            </span>
                          </td>
                          <td style={{ padding: "10px", color: "#0f172a", fontWeight: 800 }}>{p.full_name}</td>
                          <td style={{ padding: "10px", color: "#64748b", fontFamily: "monospace", fontSize: 11 }}>{p.nik || "-"}</td>
                          <td style={{ padding: "10px", color: "#475569" }}>
                            {p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString("id-ID") : "-"}
                            <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: 4 }}>({p.sex_at_birth || "Laki-laki"})</span>
                          </td>
                          <td style={{ padding: "10px", color: "#475569" }}>{p.phone || "-"}</td>
                          <td style={{ padding: "10px", textAlign: "center" }}>
                            <span style={{ background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 800 }}>
                              {p.status || "active"}
                            </span>
                          </td>
                          <td style={{ padding: "10px", textAlign: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                              <button
                                onClick={() => setSelectedDbPatient(p)}
                                title="Lihat Detail Pasien Supabase"
                                style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #cbd5e1", background: "#fff", fontSize: 11, fontWeight: 700, color: "#0369a1", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                                <Eye style={{ width: 12, height: 12 }} /> Detail
                              </button>

                              {isAdmin ? (
                                <button 
                                  onClick={() => handleDeletePatient(p.medical_record_number, p.full_name)}
                                  style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #fecaca", background: "#fef2f2", fontSize: 11, fontWeight: 700, color: "#dc2626", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                                  <Trash2 style={{ width: 12, height: 12 }} /> Hapus
                                </button>
                              ) : (
                                <button 
                                  disabled
                                  title="Hanya Admin Klinik yang dapat menghapus data pasien"
                                  style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #cbd5e1", background: "#f1f5f9", fontSize: 11, fontWeight: 700, color: "#94a3b8", cursor: "not-allowed", display: "inline-flex", alignItems: "center", gap: 4 }}>
                                  <Lock style={{ width: 10, height: 10 }} /> Terkunci
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredDbPatients.length === 0 && (
                        <tr>
                          <td colSpan={7} style={{ padding: "24px", textAlign: "center", color: "#94a3b8", fontSize: 12 }}>
                            {patientSearch ? "Tidak ada data pasien Supabase yang cocok dengan kata kunci pencarian." : "Belum ada data pasien di Supabase database."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Reset Data Danger Zone */}
              <div style={{ background: isAdmin ? "#fff5f5" : "#fafafa", border: `1.5px solid ${isAdmin ? '#fecaca' : '#e2e8f0'}`, borderRadius: 14, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <AlertTriangle style={{ width: 22, height: 22, color: isAdmin ? "#dc2626" : "#64748b" }} />
                  <h4 style={{ fontSize: 15, fontWeight: 800, color: isAdmin ? "#991b1b" : "#475569", margin: 0 }}>Reset & Clean Data Sampel</h4>
                </div>
                <p style={{ fontSize: 12, color: isAdmin ? "#7f1d1d" : "#64748b", margin: "0 0 16px", lineHeight: 1.5 }}>
                  Klik tombol di bawah untuk <strong>membersihkan semua data transaksi contoh/sampel</strong> (Pasien, Appointment, Antrean, Encounter, Resep, dan Billing). Gunakan fitur ini jika Anda ingin memulai sistem ini dalam keadaan bersih murni dari nol untuk data klinik Anda.
                </p>
                {isAdmin ? (
                  <button 
                    onClick={handleResetDataClick}
                    style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 12px rgba(220,38,38,0.3)", display: "flex", alignItems: "center", gap: 8 }}>
                    <RefreshCw style={{ width: 15, height: 15 }} /> Bersihkan Semua Data Sampel
                  </button>
                ) : (
                  <button 
                    disabled
                    onClick={handleResetDataClick}
                    style={{ background: "#cbd5e1", color: "#64748b", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 800, cursor: "not-allowed", display: "flex", alignItems: "center", gap: 8 }}>
                    <Lock style={{ width: 15, height: 15 }} /> Bersihkan Semua Data Sampel (Khusus Admin)
                  </button>
                )}
              </div>
            </Container>
          )}

          {/* TAB 3: KEAMANAN */}
          {active === "keamanan" && (
            <Container style={{ padding: 26 }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: "0 0 20px" }}>Keamanan Sistem & Hak Akses</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { key: "twoFactor", label: "Autentikasi Dua Faktor (2FA)", desc: "Wajibkan 2FA untuk semua staf klinik", enabled: securityForm.twoFactor },
                  { key: "sessionTimeout", label: "Session Timeout Otomatis", desc: "Logout otomatis setelah 30 menit tidak aktif", enabled: securityForm.sessionTimeout },
                  { key: "medicalRecordEncryption", label: "Enkripsi Rekam Medis (AES-256)", desc: "Enkripsi data sensitif pasien di Supabase", enabled: securityForm.medicalRecordEncryption },
                  { key: "auditLog", label: "Log Audit Transaksi Keamanan", desc: "Catat semua aktivitas perubahan data", enabled: securityForm.auditLog },
                ].map((s) => (
                  <div key={s.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: 12, border: "1px solid #e8f0fe" }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: 0 }}>{s.label}</p>
                      <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>{s.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSecurityForm(prev => ({ ...prev, [s.key]: !prev[s.key as keyof SecuritySettings] }))}
                      style={{
                        background: s.enabled ? "#dcfce7" : "#f1f5f9",
                        color: s.enabled ? "#15803d" : "#64748b",
                        border: `1px solid ${s.enabled ? "#bbf7d0" : "#cbd5e1"}`,
                        fontSize: 11, fontWeight: 800, padding: "5px 14px", borderRadius: 20, cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                    >
                      {s.enabled ? "✓ Aktif" : "Non-aktif"}
                    </button>
                  </div>
                ))}
              </div>
            </Container>
          )}



          {!["profil", "dokter", "database", "keamanan"].includes(active) && (
            <Container style={{ padding: 40, textAlign: "center" }}>
              <Settings style={{ width: 40, height: 40, color: "#94a3b8", margin: "0 auto 12px" }} />
              <p style={{ fontSize: 14, color: "#64748b", fontWeight: 600 }}>Pengaturan sedang disesuaikan...</p>
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
      {/* MODAL 1: DETAIL PASIEN SUPABASE */}
      {selectedDbPatient && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1200, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <Container style={{ width: "100%", maxWidth: 500, padding: 24, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, borderBottom: "1px solid #f1f5f9", paddingBottom: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 900, color: "#0f172a", margin: 0 }}>{selectedDbPatient.full_name}</h3>
                  <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 800 }}>
                    {selectedDbPatient.medical_record_number}
                  </span>
                </div>
                <p style={{ fontSize: 11.5, color: "#64748b", margin: "2px 0 0" }}>Detail Rekam Medis & Informasi di Supabase Cloud Database</p>
              </div>
              <button onClick={() => setSelectedDbPatient(null)} style={{ border: "none", background: "#f1f5f9", borderRadius: 8, width: 28, height: 28, cursor: "pointer", fontSize: 13, color: "#64748b", fontWeight: 700 }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12, color: "#334155", background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>
              <div><strong>NIK:</strong> {selectedDbPatient.nik || "-"}</div>
              <div><strong>Tanggal Lahir:</strong> {selectedDbPatient.date_of_birth ? new Date(selectedDbPatient.date_of_birth).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}</div>
              <div><strong>Jenis Kelamin:</strong> {selectedDbPatient.sex_at_birth || "Laki-laki"}</div>
              <div><strong>No. HP:</strong> {selectedDbPatient.phone || "-"}</div>
              <div><strong>Email:</strong> {selectedDbPatient.email || "-"}</div>
              <div><strong>Alamat:</strong> {selectedDbPatient.address || "-"}</div>
              <div><strong>Asuransi:</strong> {selectedDbPatient.insurance || "Umum / Bayar Sendiri"}</div>
              <div><strong>Status Database:</strong> <span style={{ color: "#166534", fontWeight: 800 }}>{selectedDbPatient.status || "active"}</span></div>
              <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 4 }}>Waktu Terdaftar: {selectedDbPatient.created_at ? new Date(selectedDbPatient.created_at).toLocaleString("id-ID") : "-"}</div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
              {isAdmin && (
                <button
                  onClick={() => handleDeletePatient(selectedDbPatient.medical_record_number, selectedDbPatient.full_name)}
                  style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  🗑️ Hapus Pasien Ini
                </button>
              )}
              <button
                onClick={() => setSelectedDbPatient(null)}
                style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#0d9488", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                Tutup
              </button>
            </div>
          </Container>
        </div>
      )}

      {/* MODAL 2: TAMBAH PASIEN DIRECT SUPABASE */}
      {showAddDbPatientModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1200, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <Container style={{ width: "100%", maxWidth: 480, padding: 22, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, borderBottom: "1px solid #f1f5f9", paddingBottom: 10 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>Tambah Pasien Baru ke Supabase</h3>
                <p style={{ fontSize: 11.5, color: "#64748b", margin: "2px 0 0" }}>Input langsung data pasien ke Cloud Database</p>
              </div>
              <button onClick={() => setShowAddDbPatientModal(false)} style={{ border: "none", background: "#f1f5f9", borderRadius: 8, width: 28, height: 28, cursor: "pointer", fontSize: 13, color: "#64748b", fontWeight: 700 }}>✕</button>
            </div>

            <form onSubmit={handleAddPatientToSupabase} style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 12 }}>
              <div>
                <label style={{ fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Nama Lengkap *</label>
                <input type="text" required placeholder="Masukkan nama lengkap" value={newDbPatient.fullName} onChange={e => setNewDbPatient({ ...newDbPatient, fullName: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", outline: "none" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>NIK</label>
                  <input type="text" placeholder="Masukkan NIK" value={newDbPatient.nik} onChange={e => setNewDbPatient({ ...newDbPatient, nik: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", outline: "none" }} />
                </div>
                <div>
                  <label style={{ fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Tanggal Lahir *</label>
                  <input type="date" required value={newDbPatient.dob} onChange={e => setNewDbPatient({ ...newDbPatient, dob: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", outline: "none" }} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Jenis Kelamin</label>
                  <select value={newDbPatient.gender} onChange={e => setNewDbPatient({ ...newDbPatient, gender: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", outline: "none", cursor: "pointer" }}>
                    <option>Laki-laki</option>
                    <option>Perempuan</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>No. HP</label>
                  <input type="tel" placeholder="Nomor HP" value={newDbPatient.phone} onChange={e => setNewDbPatient({ ...newDbPatient, phone: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", outline: "none" }} />
                </div>
              </div>

              <div>
                <label style={{ fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Asuransi</label>
                <select value={newDbPatient.insurance} onChange={e => setNewDbPatient({ ...newDbPatient, insurance: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", outline: "none", cursor: "pointer" }}>
                  <option>BPJS Kesehatan</option>
                  <option>Mandiri Inhealth</option>
                  <option>Prudential Health</option>
                  <option>Umum / Bayar Sendiri</option>
                </select>
              </div>

              <div>
                <label style={{ fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Alamat</label>
                <textarea rows={2} placeholder="Alamat lengkap" value={newDbPatient.address} onChange={e => setNewDbPatient({ ...newDbPatient, address: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", outline: "none", fontFamily: "inherit" }} />
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowAddDbPatientModal(false)} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", fontSize: 12, fontWeight: 700, color: "#64748b", cursor: "pointer" }}>
                  Batal
                </button>
                <button type="submit" style={{ flex: 2, padding: "9px 0", borderRadius: 8, border: "none", background: "#0d9488", fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer", boxShadow: "0 2px 8px rgba(13,148,136,0.2)" }}>
                  💾 Simpan ke Supabase
                </button>
              </div>
            </form>
          </Container>
        </div>
      )}
    </div>
  );
}
