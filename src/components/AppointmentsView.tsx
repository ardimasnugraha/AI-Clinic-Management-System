"use client";

import React, { useState, useEffect } from "react";
import { 
  Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Search, 
  Filter, Clock, User, CheckCircle2, AlertCircle, Phone, 
  Stethoscope, Building2, FileText, ArrowRight, RefreshCw, Sparkles,
  Check, X, Activity, UserCheck, HeartPulse
} from "lucide-react";
import { supabase, isConfigured } from "@/lib/supabase/client";
import { addQueueTicketDirect } from "@/lib/store";

interface AppointmentsViewProps {
  initialPatient?: { rm: string; name: string; phone: string } | null;
  onClearInitialPatient?: () => void;
  onNavigateTab?: (tabName: string) => void;
}

export interface AppointmentItem {
  id: string;
  patientName: string;
  phone: string;
  doctorName: string;
  poli: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  type: "Konsultasi" | "Kontrol" | "Tindakan" | "Telekonsultasi";
  status: "Baru" | "Berjalan" | "Menunggu" | "Selesai" | "Dibatalkan";
  notes?: string;
  dayIndex?: number; // 0: Sen, 1: Sel, etc.
}

// Doctor Specialty & Poli Auto Mapping Dictionary
const DOCTOR_MAP: Record<string, { poli: string; keywords: string[] }> = {
  "dr. Maya Lestari": { poli: "Poli Umum", keywords: ["demam", "flu", "pusing", "batuk", "umum"] },
  "drg. Sari Dewi": { poli: "Poli Gigi", keywords: ["gigi", "gusi", "behel", "tambal"] },
  "dr. Ahmad Rizki": { poli: "Poli Jantung", keywords: ["jantung", "dada", "hipertensi", "sesak"] },
  "dr. Laila Rahmawati": { poli: "Poli Kulit", keywords: ["kulit", "gatal", "jerawat", "ruam", "alergi kulit"] },
  "dr. Rudi Setiawan": { poli: "Poli Anak", keywords: ["anak", "bayi", "imunisasi", "demam anak"] },
  "dr. Hendra Kusuma": { poli: "Poli Mata", keywords: ["mata", "katarak", "minus", "penglihatan"] },
  "dr. Bagus W.": { poli: "Poli Penyakit Dalam", keywords: ["lambung", "maag", "diabetes", "penyakit dalam"] },
  "dr. Dimas A.": { poli: "Poli Gigi", keywords: ["gigi", "gusi"] },
  "dr. Ratna Sari": { poli: "Poli Anak", keywords: ["anak"] }
};

const POLI_DEFAULT_DOCTOR: Record<string, string> = {
  "Poli Umum": "dr. Maya Lestari",
  "Poli Gigi": "drg. Sari Dewi",
  "Poli Jantung": "dr. Ahmad Rizki",
  "Poli Kulit": "dr. Laila Rahmawati",
  "Poli Anak": "dr. Rudi Setiawan",
  "Poli Mata": "dr. Hendra Kusuma",
  "Poli Penyakit Dalam": "dr. Bagus W."
};

const DEFAULT_APPOINTMENTS: AppointmentItem[] = [
  { id: "APT-001", patientName: "Andi Pratama", phone: "0812-3456-7890", doctorName: "dr. Maya Lestari", poli: "Poli Umum", date: "2025-05-19", time: "08:00", type: "Konsultasi", status: "Selesai", dayIndex: 0 },
  { id: "APT-002", patientName: "Siti Nurhaliza", phone: "0813-8765-4321", doctorName: "dr. Dimas A.", poli: "Poli Gigi", date: "2025-05-19", time: "10:00", type: "Kontrol", status: "Berjalan", dayIndex: 0 },
  { id: "APT-003", patientName: "Budi Santoso", phone: "0811-2233-4455", doctorName: "dr. Ratna Sari", poli: "Poli Anak", date: "2025-05-19", time: "13:00", type: "Konsultasi", status: "Menunggu", dayIndex: 0 },
  { id: "APT-004", patientName: "Dewi Anggraini", phone: "0821-9988-7766", doctorName: "dr. Bagus W.", poli: "Poli Penyakit Dalam", date: "2025-05-19", time: "15:00", type: "Tindakan", status: "Baru", dayIndex: 0 },
  
  { id: "APT-005", patientName: "Rudi Hermawan", phone: "0814-5566-7788", doctorName: "dr. Dimas A.", poli: "Poli Gigi", date: "2025-05-20", time: "09:00", type: "Konsultasi", status: "Selesai", dayIndex: 1 },
  { id: "APT-006", patientName: "Lina Marlina", phone: "0815-1122-3344", doctorName: "dr. Maya Lestari", poli: "Poli Umum", date: "2025-05-20", time: "11:30", type: "Kontrol", status: "Berjalan", dayIndex: 1 },
  { id: "APT-007", patientName: "Agus Setiawan", phone: "0816-3344-5566", doctorName: "dr. Ahmad Rizki", poli: "Poli Jantung", date: "2025-05-20", time: "14:30", type: "Konsultasi", status: "Menunggu", dayIndex: 1 },
  
  { id: "APT-008", patientName: "Tono Wijaya", phone: "0817-4455-6677", doctorName: "dr. Ratna Sari", poli: "Poli Anak", date: "2025-05-21", time: "08:30", type: "Konsultasi", status: "Selesai", dayIndex: 2 },
  { id: "APT-009", patientName: "Nia Kurniawati", phone: "0818-5566-7788", doctorName: "dr. Maya Lestari", poli: "Poli Umum", date: "2025-05-21", time: "10:30", type: "Kontrol", status: "Berjalan", dayIndex: 2 },
  { id: "APT-010", patientName: "Dian Puspita", phone: "0819-6677-8899", doctorName: "dr. Laila Rahmawati", poli: "Poli Kulit", date: "2025-05-21", time: "13:30", type: "Tindakan", status: "Menunggu", dayIndex: 2 },
  { id: "APT-011", patientName: "Slamet Riyadi", phone: "0820-7788-9900", doctorName: "dr. Bagus W.", poli: "Poli Penyakit Dalam", date: "2025-05-21", time: "16:00", type: "Konsultasi", status: "Baru", dayIndex: 2 },
  
  { id: "APT-012", patientName: "Fajar Nugroho", phone: "0821-1122-3344", doctorName: "drg. Sari Dewi", poli: "Poli Gigi", date: "2025-05-22", time: "09:00", type: "Konsultasi", status: "Baru", dayIndex: 3 },
  { id: "APT-013", patientName: "Yulia Safitri", phone: "0822-2233-4455", doctorName: "dr. Maya Lestari", poli: "Poli Umum", date: "2025-05-22", time: "11:00", type: "Kontrol", status: "Baru", dayIndex: 3 },
  { id: "APT-014", patientName: "Heri Susanto", phone: "0823-3344-5566", doctorName: "dr. Hendra Kusuma", poli: "Poli Mata", date: "2025-05-22", time: "14:00", type: "Konsultasi", status: "Menunggu", dayIndex: 3 },
  
  { id: "APT-015", patientName: "Putri Anjani", phone: "0824-4455-6677", doctorName: "dr. Rudi Setiawan", poli: "Poli Anak", date: "2025-05-23", time: "08:00", type: "Telekonsultasi", status: "Baru", dayIndex: 4 },
  { id: "APT-016", patientName: "Ahmad Fauzi", phone: "0825-5566-7788", doctorName: "dr. Ahmad Rizki", poli: "Poli Jantung", date: "2025-05-23", time: "10:00", type: "Konsultasi", status: "Menunggu", dayIndex: 4 },
  { id: "APT-017", patientName: "Maya Sari", phone: "0826-6677-8899", doctorName: "dr. Rudi Setiawan", poli: "Poli Anak", date: "2025-05-23", time: "13:00", type: "Kontrol", status: "Menunggu", dayIndex: 4 },
  
  { id: "APT-018", patientName: "Ika Lestari", phone: "0827-7788-9900", doctorName: "dr. Maya Lestari", poli: "Poli Umum", date: "2025-05-24", time: "09:30", type: "Konsultasi", status: "Baru", dayIndex: 5 },
  { id: "APT-019", patientName: "Dedi Kurnia", phone: "0828-8899-0011", doctorName: "dr. Bagus W.", poli: "Poli Penyakit Dalam", date: "2025-05-24", time: "12:00", type: "Tindakan", status: "Baru", dayIndex: 5 },
  { id: "APT-020", patientName: "Rahmawati", phone: "0829-9900-1122", doctorName: "drg. Sari Dewi", poli: "Poli Gigi", date: "2025-05-24", time: "15:00", type: "Konsultasi", status: "Menunggu", dayIndex: 5 },
  
  { id: "APT-021", patientName: "Bambang H.", phone: "0830-0011-2233", doctorName: "dr. Bagus W.", poli: "Poli Penyakit Dalam", date: "2025-05-25", time: "10:00", type: "Konsultasi", status: "Baru", dayIndex: 6 }
];

export default function AppointmentsView({ initialPatient, onClearInitialPatient, onNavigateTab }: AppointmentsViewProps) {
  const [appointments, setAppointments] = useState<AppointmentItem[]>(DEFAULT_APPOINTMENTS);
  const [viewMode, setViewMode] = useState<"Mingguan" | "Harian">("Mingguan");
  const [checkInTab, setCheckInTab] = useState<"Check-in" | "Check-out">("Check-in");

  // Filters State
  const [filterDoctor, setFilterDoctor] = useState("Semua Dokter");
  const [filterPoli, setFilterPoli] = useState("Semua Poli");
  const [filterBranch, setFilterBranch] = useState("Semua Cabang");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [complaintInput, setComplaintInput] = useState("");
  const [aiSuggestedInfo, setAiSuggestedInfo] = useState<string | null>(null);

  const [newAppt, setNewAppt] = useState({
    patientName: "",
    phone: "",
    doctorName: "dr. Maya Lestari",
    poli: "Poli Umum",
    date: new Date().toISOString().split("T")[0],
    time: "09:00",
    type: "Konsultasi" as const,
    notes: ""
  });

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Auto-sync Poli when Doctor Changes
  const handleDoctorChange = (docName: string) => {
    const matchedPoli = DOCTOR_MAP[docName]?.poli || "Poli Umum";
    setNewAppt(prev => ({
      ...prev,
      doctorName: docName,
      poli: matchedPoli
    }));
    showToast(`🤖 AI: Dokter ${docName} dipilih → Poli otomatis diset ke ${matchedPoli}`);
  };

  // Auto-sync Doctor when Poli Changes
  const handlePoliChange = (poliName: string) => {
    const defaultDoc = POLI_DEFAULT_DOCTOR[poliName] || "dr. Maya Lestari";
    setNewAppt(prev => ({
      ...prev,
      poli: poliName,
      doctorName: defaultDoc
    }));
    showToast(`🤖 AI: ${poliName} dipilih → Dokter otomatis diset ke ${defaultDoc}`);
  };

  // Auto-detect Complaint / Keluhan to match Doctor & Poli
  const handleComplaintChange = (text: string) => {
    setComplaintInput(text);
    const lower = text.toLowerCase();

    for (const [docName, info] of Object.entries(DOCTOR_MAP)) {
      if (info.keywords.some(kw => lower.includes(kw))) {
        setNewAppt(prev => ({
          ...prev,
          doctorName: docName,
          poli: info.poli
        }));
        setAiSuggestedInfo(`✨ AI merekomendasikan ${docName} (${info.poli}) sesuai keluhan "${text}"`);
        return;
      }
    }
    setAiSuggestedInfo(null);
  };

  // Prefill if initialPatient passed
  useEffect(() => {
    if (initialPatient) {
      setNewAppt(prev => ({
        ...prev,
        patientName: initialPatient.name,
        phone: initialPatient.phone || "0812-0000-0000"
      }));
      setShowModal(true);
    }
  }, [initialPatient]);

  // Fetch Appointments from Supabase & LocalStorage
  useEffect(() => {
    async function loadAppointments() {
      try {
        const { data } = await supabase.from("appointments").select("*").order("created_at", { ascending: false });
        if (data && data.length > 0) {
          const mapped: AppointmentItem[] = data.map((a: any, idx: number) => ({
            id: a.id || `APT-${idx+1}`,
            patientName: a.patient_name || a.doctor_name || "Pasien",
            phone: a.phone || "0812-3456-7890",
            doctorName: a.doctor_name || "dr. Maya Lestari",
            poli: a.poli || "Poli Umum",
            date: (a.scheduled_time && typeof a.scheduled_time === 'string') ? a.scheduled_time.split("T")[0] : "2025-05-21",
            time: (a.duration && typeof a.duration === 'string') ? a.duration.split(" - ")[0] : "09:00",
            type: "Konsultasi",
            status: a.status === "menunggu" ? "Menunggu" : a.status === "selesai" ? "Selesai" : "Baru",
            dayIndex: idx % 7
          }));
          setAppointments(mapped);
        } else {
          const localA = localStorage.getItem("clinic_appointments_v1");
          if (localA) {
            setAppointments(JSON.parse(localA));
          }
        }
      } catch (err) {
        console.warn("Using fallback appointments data:", err);
      }
    }
    loadAppointments();
  }, []);

  // Create New Appointment
  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppt.patientName.trim()) {
      showToast("❌ Nama Pasien wajib diisi.");
      return;
    }

    const created: AppointmentItem = {
      id: `APT-${Date.now()}`,
      patientName: newAppt.patientName,
      phone: newAppt.phone || "0812-0000-0000",
      doctorName: newAppt.doctorName,
      poli: newAppt.poli,
      date: newAppt.date,
      time: newAppt.time,
      type: newAppt.type,
      status: "Baru",
      dayIndex: 2
    };

    if (isConfigured) {
      try {
        await supabase.from("appointments").insert([{
          clinic_id: "11111111-1111-1111-1111-111111111111",
          patient_id: "22222222-2222-2222-2222-222222222222",
          doctor_name: newAppt.doctorName,
          poli: newAppt.poli,
          scheduled_time: `${newAppt.date}T${newAppt.time}:00Z`,
          duration: `${newAppt.time} - 30m`,
          status: "Menunggu"
        }]);
      } catch (err) {}
    }

    const updated = [created, ...appointments];
    setAppointments(updated);
    localStorage.setItem("clinic_appointments_v1", JSON.stringify(updated));

    setShowModal(false);
    if (onClearInitialPatient) onClearInitialPatient();
    showToast(`✅ Berhasil membuat appointment untuk ${created.patientName} (${created.doctorName} - ${created.poli})`);
  };

  // Perform Check-in
  const handlePerformCheckIn = (apt: AppointmentItem) => {
    addQueueTicketDirect({ rm: "RM000123", name: apt.patientName, phone: apt.phone }, (apt.poli || "Umum").replace("Poli ", ""));
    const updated = appointments.map(a => a.id === apt.id ? { ...a, status: "Berjalan" as const } : a);
    setAppointments(updated);
    showToast(`✅ ${apt.patientName} berhasil Check-in ke ${apt.poli}!`);
  };

  // Type Color Badges Helper
  const getTypeColor = (type: string) => {
    switch (type) {
      case "Konsultasi": return { bg: "#e0f2fe", border: "#bae6fd", text: "#0369a1" };
      case "Kontrol": return { bg: "#fff7ed", border: "#fed7aa", text: "#c2410c" };
      case "Tindakan": return { bg: "#f3e8ff", border: "#e9d5ff", text: "#6b21a8" };
      case "Telekonsultasi": return { bg: "#fce7f3", border: "#fbcfe8", text: "#be185d" };
      default: return { bg: "#f1f5f9", border: "#e2e8f0", text: "#475569" };
    }
  };

  const DAYS_HEADER = [
    { day: "Sen", date: "19 Mei", idx: 0 },
    { day: "Sel", date: "20 Mei", idx: 1 },
    { day: "Rab", date: "21 Mei", idx: 2, isActive: true },
    { day: "Kam", date: "22 Mei", idx: 3 },
    { day: "Jum", date: "23 Mei", idx: 4 },
    { day: "Sab", date: "24 Mei", idx: 5 },
    { day: "Min", date: "25 Mei", idx: 6 }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: "Inter, system-ui, sans-serif" }}>
      
      {/* Toast Notification */}
      {toastMsg && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 2000, background: "#0f172a", color: "#fff", padding: "12px 20px", borderRadius: 12, boxShadow: "0 10px 25px rgba(0,0,0,0.2)", fontSize: 13, fontWeight: 700 }}>
          {toastMsg}
        </div>
      )}

      {/* ================= MODAL BUAT APPOINTMENT ================= */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 480, padding: 24, boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CalendarIcon style={{ width: 18, height: 18, color: "#0284c7" }} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 900, color: "#0f172a", margin: 0 }}>Buat Appointment Baru</h3>
              </div>
              <button onClick={() => setShowModal(false)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 18, color: "#64748b" }}>✕</button>
            </div>

            <form onSubmit={handleSaveAppointment} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Nama Pasien *</label>
                <input type="text" required placeholder="Masukkan nama pasien" value={newAppt.patientName} onChange={e => setNewAppt({ ...newAppt, patientName: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 12.5, outline: "none" }} />
              </div>

              {/* AI Auto Suggestion Keluhan / Penyakit Pasien */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span>Keluhan / Penyakit Pasien</span>
                  <span style={{ fontSize: 10, background: "#f3e8ff", color: "#6b21a8", padding: "1px 6px", borderRadius: 6, fontWeight: 800 }}>AI Auto-Match</span>
                </label>
                <input 
                  type="text" 
                  placeholder="Ketik keluhan (cth: Nyeri Dada/Jantung, Sakit Gigi, Gatal Kulit, Mata)..." 
                  value={complaintInput} 
                  onChange={e => handleComplaintChange(e.target.value)} 
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 12, outline: "none", background: "#fafafa" }} 
                />
                {aiSuggestedInfo && (
                  <div style={{ fontSize: 11, color: "#6b21a8", fontWeight: 700, marginTop: 4, background: "#faf5ff", padding: "4px 8px", borderRadius: 6 }}>
                    {aiSuggestedInfo}
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Dokter Pemeriksa *</label>
                  <select 
                    value={newAppt.doctorName} 
                    onChange={e => handleDoctorChange(e.target.value)} 
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #0d9488", fontSize: 12.5, outline: "none", cursor: "pointer", fontWeight: 800, color: "#0d9488" }}>
                    <option value="dr. Maya Lestari">dr. Maya Lestari (Umum)</option>
                    <option value="drg. Sari Dewi">drg. Sari Dewi (Gigi)</option>
                    <option value="dr. Ahmad Rizki">dr. Ahmad Rizki (Jantung)</option>
                    <option value="dr. Laila Rahmawati">dr. Laila (Kulit)</option>
                    <option value="dr. Rudi Setiawan">dr. Rudi Setiawan (Anak)</option>
                    <option value="dr. Hendra Kusuma">dr. Hendra Kusuma (Mata)</option>
                    <option value="dr. Bagus W.">dr. Bagus W. (Penyakit Dalam)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Poli Klinik (Otomatis)</label>
                  <select 
                    value={newAppt.poli} 
                    onChange={e => handlePoliChange(e.target.value)} 
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #0d9488", fontSize: 12.5, outline: "none", cursor: "pointer", fontWeight: 800, color: "#0d9488" }}>
                    <option value="Poli Umum">Poli Umum</option>
                    <option value="Poli Gigi">Poli Gigi</option>
                    <option value="Poli Jantung">Poli Jantung</option>
                    <option value="Poli Kulit">Poli Kulit</option>
                    <option value="Poli Anak">Poli Anak</option>
                    <option value="Poli Mata">Poli Mata</option>
                    <option value="Poli Penyakit Dalam">Poli Penyakit Dalam</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>No. HP Pasien</label>
                  <input type="tel" placeholder="08xxxxxxxxxx" value={newAppt.phone} onChange={e => setNewAppt({ ...newAppt, phone: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 12.5, outline: "none" }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Jenis Layanan</label>
                  <select value={newAppt.type} onChange={e => setNewAppt({ ...newAppt, type: e.target.value as any })} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 12.5, outline: "none", cursor: "pointer" }}>
                    <option>Konsultasi</option>
                    <option>Kontrol</option>
                    <option>Tindakan</option>
                    <option>Telekonsultasi</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Tanggal</label>
                  <input type="date" value={newAppt.date} onChange={e => setNewAppt({ ...newAppt, date: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 12.5, outline: "none" }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Jam Slot</label>
                  <select value={newAppt.time} onChange={e => setNewAppt({ ...newAppt, time: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 12.5, outline: "none", cursor: "pointer" }}>
                    <option>08:00</option>
                    <option>08:30</option>
                    <option>09:00</option>
                    <option>09:30</option>
                    <option>10:00</option>
                    <option>10:30</option>
                    <option>11:00</option>
                    <option>13:00</option>
                    <option>14:00</option>
                    <option>15:00</option>
                  </select>
                </div>
              </div>

              <button type="submit" style={{ width: "100%", marginTop: 8, padding: "12px 0", borderRadius: 12, border: "none", background: "#0d9488", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 14px rgba(13,148,136,0.3)" }}>
                💾 Simpan Appointment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= HEADER SECTION ================= */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", margin: 0 }}>Appointment & Jadwal</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>Kelola jadwal, booking, dan ketersediaan dokter dengan mudah.</p>
        </div>

        <button 
          onClick={() => setShowModal(true)}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 12, border: "none", background: "#0d9488", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 14px rgba(13,148,136,0.25)" }}>
          <Plus style={{ width: 18, height: 18 }} /> Buat Appointment
        </button>
      </div>

      {/* ================= FILTER BAR ATAS ================= */}
      <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #f1f5f9", padding: 16, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
        
        {/* Filter Dokter */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", marginBottom: 2 }}>Dokter</span>
          <select value={filterDoctor} onChange={e => setFilterDoctor(e.target.value)} style={{ padding: "8px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 12, fontWeight: 700, color: "#334155", background: "#fff", cursor: "pointer", outline: "none" }}>
            <option>Semua Dokter</option>
            <option>dr. Maya Lestari (Umum)</option>
            <option>drg. Sari Dewi (Gigi)</option>
            <option>dr. Ahmad Rizki (Jantung)</option>
            <option>dr. Laila Rahmawati (Kulit)</option>
            <option>dr. Rudi Setiawan (Anak)</option>
            <option>dr. Hendra Kusuma (Mata)</option>
            <option>dr. Bagus W. (Penyakit Dalam)</option>
          </select>
        </div>

        {/* Filter Poli */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", marginBottom: 2 }}>Poli</span>
          <select value={filterPoli} onChange={e => setFilterPoli(e.target.value)} style={{ padding: "8px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 12, fontWeight: 700, color: "#334155", background: "#fff", cursor: "pointer", outline: "none" }}>
            <option>Semua Poli</option>
            <option>Poli Umum</option>
            <option>Poli Gigi</option>
            <option>Poli Jantung</option>
            <option>Poli Kulit</option>
            <option>Poli Anak</option>
            <option>Poli Mata</option>
            <option>Poli Penyakit Dalam</option>
          </select>
        </div>

        {/* Filter Cabang */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", marginBottom: 2 }}>Cabang</span>
          <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} style={{ padding: "8px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 12, fontWeight: 700, color: "#334155", background: "#fff", cursor: "pointer", outline: "none" }}>
            <option>Semua Cabang</option>
            <option>Semarang</option>
            <option>Jakarta</option>
            <option>Surabaya</option>
          </select>
        </div>

        {/* Date Range Picker */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", marginBottom: 2 }}>Tanggal</span>
          <div style={{ padding: "8px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 12, fontWeight: 700, color: "#334155", background: "#fff", display: "flex", alignItems: "center", gap: 6 }}>
            <CalendarIcon style={{ width: 14, height: 14, color: "#0d9488" }} /> 19 - 25 Mei 2025
          </div>
        </div>

        <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", marginTop: 14, borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: 12, fontWeight: 750, cursor: "pointer" }}>
          <Filter style={{ width: 14, height: 14 }} /> Filter Lainnya
        </button>

      </div>

      {/* ================= TOP SECTION: TIMETABLE GRID (LEFT) + 3 CARDS (RIGHT) ================= */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, alignItems: "start" }}>
        
        {/* LEFT: KALENDER JADWAL MINGGUAN (TIMETABLE GRID) */}
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #f1f5f9", padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
          
          {/* Timetable Header Bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h3 style={{ fontSize: 15, fontWeight: 900, color: "#0f172a", margin: 0 }}>Kalender Jadwal Mingguan</h3>
              <div style={{ display: "flex", gap: 4 }}>
                <button style={{ border: "1px solid #e2e8f0", background: "#fff", borderRadius: 6, padding: "2px 6px", cursor: "pointer" }}><ChevronLeft style={{ width: 14, height: 14, color: "#64748b" }} /></button>
                <button style={{ border: "1px solid #e2e8f0", background: "#fff", borderRadius: 6, padding: "2px 6px", cursor: "pointer" }}><ChevronRight style={{ width: 14, height: 14, color: "#64748b" }} /></button>
                <button style={{ border: "1px solid #e2e8f0", background: "#f8fafc", borderRadius: 6, padding: "2px 8px", fontSize: 10.5, fontWeight: 700, cursor: "pointer", color: "#334155" }}>Hari Ini</button>
              </div>
            </div>

            {/* Legend & Mode Toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 10.5, fontWeight: 700, color: "#475569" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#0d9488" }} /> Konsultasi</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b" }} /> Kontrol</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#8b5cf6" }} /> Tindakan</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ec4899" }} /> Telekonsultasi</span>
              </div>

              <div style={{ display: "flex", background: "#f1f5f9", padding: 2, borderRadius: 8 }}>
                <button onClick={() => setViewMode("Mingguan")} style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: viewMode === "Mingguan" ? "#0d9488" : "none", color: viewMode === "Mingguan" ? "#fff" : "#64748b", fontSize: 10.5, fontWeight: 800, cursor: "pointer" }}>Mingguan</button>
                <button onClick={() => setViewMode("Harian")} style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: viewMode === "Harian" ? "#0d9488" : "none", color: viewMode === "Harian" ? "#fff" : "#64748b", fontSize: 10.5, fontWeight: 800, cursor: "pointer" }}>Harian</button>
              </div>
            </div>
          </div>

          {/* Timetable Grid Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse", textAlign: "center", minWidth: 650 }}>
              <thead>
                <tr style={{ background: "#fafafa", borderBottom: "1.5px solid #f1f5f9" }}>
                  <th style={{ padding: "8px 4px", width: 50, color: "#94a3b8" }}>Jam</th>
                  {DAYS_HEADER.map(dh => (
                    <th key={dh.day} style={{ padding: "8px 4px", borderLeft: "1px solid #f1f5f9" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: dh.isActive ? "#0d9488" : "#64748b" }}>{dh.day}</div>
                      <div style={{ 
                        fontSize: 10, fontWeight: 800, marginTop: 2,
                        ...(dh.isActive ? { background: "#0d9488", color: "#fff", borderRadius: "50%", width: 22, height: 22, display: "inline-flex", alignItems: "center", justifyContent: "center", margin: "2px auto 0" } : { color: "#0f172a" })
                      }}>
                        {dh.date.split(" ")[0]}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"].map((slotTime) => (
                  <tr key={slotTime} style={{ borderBottom: "1px solid #f8fafc", height: 50 }}>
                    <td style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", padding: "4px" }}>{slotTime}</td>
                    {DAYS_HEADER.map(dh => {
                      const matchedApt = appointments.find(a => a.dayIndex === dh.idx && a.time.startsWith(slotTime.slice(0, 2)));
                      const col = matchedApt ? getTypeColor(matchedApt.type) : null;

                      return (
                        <td key={dh.day} style={{ borderLeft: "1px solid #f8fafc", padding: 2, verticalAlign: "top" }}>
                          {matchedApt && (
                            <div 
                              onClick={() => showToast(`📅 ${matchedApt.patientName} (${matchedApt.time}) - ${matchedApt.doctorName} (${matchedApt.poli})`)}
                              style={{ 
                                background: col?.bg, border: `1px solid ${col?.border}`, color: col?.text,
                                borderRadius: 8, padding: "4px 6px", textAlign: "left", cursor: "pointer",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
                              }}>
                              <div style={{ fontSize: 9.5, fontWeight: 800, display: "flex", justifyContent: "space-between" }}>
                                <span>{matchedApt.time}</span>
                              </div>
                              <div style={{ fontSize: 10.5, fontWeight: 900, color: "#0f172a", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {matchedApt.patientName}
                              </div>
                              <div style={{ fontSize: 8.5, color: "#64748b", marginTop: 1 }}>{matchedApt.doctorName}</div>
                              <div style={{ fontSize: 8, fontWeight: 700, color: col?.text }}>{matchedApt.poli}</div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

        {/* RIGHT: 3 STACKED CARDS */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          
          {/* Card 1: Booking Baru Hari Ini */}
          <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #f1f5f9", padding: 18, boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ fontSize: 14.5, fontWeight: 900, color: "#0f172a", margin: 0 }}>Booking Baru Hari Ini</h3>
              <a href="#" style={{ fontSize: 11, fontWeight: 700, color: "#0d9488", textDecoration: "none" }}>Lihat Semua →</a>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {appointments.filter(a => a.status === "Baru").slice(0, 5).map((apt, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fafafa", padding: "8px 10px", borderRadius: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#ccfbf1", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#0d9488", fontSize: 11 }}>
                      {(apt.patientName || "Pasien").split(" ").map(w => w[0]).slice(0, 2).join("")}
                    </div>
                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 800, color: "#0f172a" }}>
                        <span style={{ color: "#0d9488", marginRight: 6 }}>{apt.time}</span>{apt.patientName || "Pasien"}
                      </div>
                      <div style={{ fontSize: 10, color: "#64748b" }}>{apt.doctorName} • {apt.poli}</div>
                    </div>
                  </div>

                  <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: 10, fontSize: 9.5, fontWeight: 800 }}>Baru</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Ringkasan Ketersediaan Dokter */}
          <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #f1f5f9", padding: 18, boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontSize: 14.5, fontWeight: 900, color: "#0f172a", margin: 0 }}>Ringkasan Ketersediaan Dokter</h3>
              <a href="#" style={{ fontSize: 11, fontWeight: 700, color: "#0d9488", textDecoration: "none" }}>Lihat Semua →</a>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Doctor 1 */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>
                  <span>dr. Maya Lestari <span style={{ fontWeight: 500, color: "#64748b" }}>(Poli Umum)</span></span>
                  <span style={{ color: "#0d9488" }}>13 / 20 slot</span>
                </div>
                <div style={{ width: "100%", height: 6, borderRadius: 10, background: "#f1f5f9", overflow: "hidden" }}>
                  <div style={{ width: "65%", height: "100%", background: "#0d9488", borderRadius: 10 }} />
                </div>
              </div>

              {/* Doctor 2 */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>
                  <span>drg. Sari Dewi <span style={{ fontWeight: 500, color: "#64748b" }}>(Poli Gigi)</span></span>
                  <span style={{ color: "#0284c7" }}>8 / 20 slot</span>
                </div>
                <div style={{ width: "100%", height: 6, borderRadius: 10, background: "#f1f5f9", overflow: "hidden" }}>
                  <div style={{ width: "40%", height: "100%", background: "#0284c7", borderRadius: 10 }} />
                </div>
              </div>

              {/* Doctor 3 */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>
                  <span>dr. Ahmad Rizki <span style={{ fontWeight: 500, color: "#64748b" }}>(Poli Jantung)</span></span>
                  <span style={{ color: "#ef4444" }}>16 / 20 slot</span>
                </div>
                <div style={{ width: "100%", height: 6, borderRadius: 10, background: "#f1f5f9", overflow: "hidden" }}>
                  <div style={{ width: "80%", height: "100%", background: "#ef4444", borderRadius: 10 }} />
                </div>
              </div>

              {/* Doctor 4 */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>
                  <span>dr. Laila Rahmawati <span style={{ fontWeight: 500, color: "#64748b" }}>(Poli Kulit)</span></span>
                  <span style={{ color: "#ec4899" }}>11 / 20 slot</span>
                </div>
                <div style={{ width: "100%", height: 6, borderRadius: 10, background: "#f1f5f9", overflow: "hidden" }}>
                  <div style={{ width: "55%", height: "100%", background: "#ec4899", borderRadius: 10 }} />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Check-in / Check-out */}
          <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #f1f5f9", padding: 18, boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ fontSize: 14.5, fontWeight: 900, color: "#0f172a", margin: 0 }}>Check-in / Check-out</h3>
              <a href="#" style={{ fontSize: 11, fontWeight: 700, color: "#0d9488", textDecoration: "none" }}>Lihat Semua →</a>
            </div>

            {/* Check-in / Check-out Tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <button onClick={() => setCheckInTab("Check-in")} style={{ padding: "4px 12px", borderRadius: 8, border: "none", background: checkInTab === "Check-in" ? "#e0f2fe" : "#f1f5f9", color: checkInTab === "Check-in" ? "#0369a1" : "#64748b", fontSize: 10.5, fontWeight: 800, cursor: "pointer" }}>Check-in (3)</button>
              <button onClick={() => setCheckInTab("Check-out")} style={{ padding: "4px 12px", borderRadius: 8, border: "none", background: checkInTab === "Check-out" ? "#e0f2fe" : "#f1f5f9", color: checkInTab === "Check-out" ? "#0369a1" : "#64748b", fontSize: 10.5, fontWeight: 800, cursor: "pointer" }}>Check-out (2)</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {appointments.slice(1, 4).map((apt, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fafafa", padding: "8px 10px", borderRadius: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#6d28d9", fontSize: 10 }}>
                      {(apt.patientName || "Pasien").split(" ").map(w => w[0]).slice(0, 2).join("")}
                    </div>
                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 800, color: "#0f172a" }}>{apt.patientName || "Pasien"}</div>
                      <div style={{ fontSize: 9.5, color: "#64748b" }}>{apt.time} • {apt.doctorName}</div>
                    </div>
                  </div>

                  <button 
                    onClick={() => handlePerformCheckIn(apt)}
                    style={{ padding: "4px 10px", borderRadius: 8, border: "none", background: "#dcfce7", color: "#15803d", fontSize: 10, fontWeight: 800, cursor: "pointer" }}>
                    Check-in
                  </button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12, textAlign: "center" }}>
              <button 
                onClick={() => onNavigateTab?.("Antrean")}
                style={{ border: "none", background: "none", fontSize: 11, fontWeight: 700, color: "#0d9488", cursor: "pointer" }}>
                Buka Daftar Antrian →
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* ================= BOTTOM SECTION: BOOKING HARI INI TABLE (LEFT) + REKOMENDASI AI (RIGHT) ================= */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, alignItems: "start" }}>
        
        {/* BOOKING HARI INI TABLE */}
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #f1f5f9", padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 900, color: "#0f172a", margin: 0 }}>Booking Hari Ini</h3>
            <a href="#" style={{ fontSize: 11.5, fontWeight: 700, color: "#0d9488", textDecoration: "none" }}>Lihat Semua →</a>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 11.5, borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ color: "#94a3b8", fontWeight: 700, borderBottom: "1.5px solid #f1f5f9" }}>
                  <th style={{ padding: "8px 6px" }}>Waktu</th>
                  <th style={{ padding: "8px 6px" }}>Pasien</th>
                  <th style={{ padding: "8px 6px" }}>Dokter</th>
                  <th style={{ padding: "8px 6px" }}>Poli</th>
                  <th style={{ padding: "8px 6px" }}>Jenis</th>
                  <th style={{ padding: "8px 6px" }}>Status</th>
                </tr>
              </thead>
              <tbody style={{ fontWeight: 600, color: "#334155" }}>
                {appointments.slice(0, 5).map((apt, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <td style={{ padding: "9px 6px", fontWeight: 800, color: "#0d9488" }}>📅 {apt.time}</td>
                    <td style={{ padding: "9px 6px", fontWeight: 800, color: "#0f172a" }}>{apt.patientName || "Pasien"}</td>
                    <td style={{ padding: "9px 6px" }}>{apt.doctorName}</td>
                    <td style={{ padding: "9px 6px", color: "#64748b" }}>{(apt.poli || "Poli Umum").replace("Poli ", "")}</td>
                    <td style={{ padding: "9px 6px" }}>{apt.type}</td>
                    <td style={{ padding: "9px 6px" }}>
                      <span style={{ 
                        background: apt.status === "Selesai" ? "#dcfce7" : apt.status === "Berjalan" ? "#ede9fe" : apt.status === "Menunggu" ? "#fff7ed" : "#e0f2fe", 
                        color: apt.status === "Selesai" ? "#15803d" : apt.status === "Berjalan" ? "#6d28d9" : apt.status === "Menunggu" ? "#c2410c" : "#0369a1", 
                        padding: "2px 8px", borderRadius: 12, fontSize: 9.5, fontWeight: 800 
                      }}>
                        {apt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* REKOMENDASI AI CARD */}
        <div style={{ background: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)", borderRadius: 20, border: "1px solid #e9d5ff", padding: 20, boxShadow: "0 2px 10px rgba(139,92,246,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Sparkles style={{ width: 18, height: 18, color: "#8b5cf6" }} />
            <h3 style={{ fontSize: 15, fontWeight: 900, color: "#581c87", margin: 0 }}>Rekomendasi AI</h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Item 1 */}
            <div style={{ background: "#fff", padding: 12, borderRadius: 14, border: "1px solid #f3e8ff", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                  <CheckCircle2 style={{ width: 14, height: 14, color: "#166534" }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a" }}>Optimasi Slot Terbuka</div>
                  <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 2 }}>Terdeteksi 6 slot terbuka yang berpotensi meningkatkan utilisasi hingga 18%.</div>
                </div>
              </div>
              <button onClick={() => showToast("✨ Rekomendasi Optimasi Slot Terbuka berhasil diterapkan!")} style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: "#0d9488", color: "#fff", fontSize: 11, fontWeight: 800, cursor: "pointer", flexShrink: 0 }}>Terapkan</button>
            </div>

            {/* Item 2 */}
            <div style={{ background: "#fff", padding: 12, borderRadius: 14, border: "1px solid #f3e8ff", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                  <AlertCircle style={{ width: 14, height: 14, color: "#d97706" }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a" }}>Pengingat Pasien No-Show</div>
                  <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 2 }}>3 pasien memiliki riwayat no-show. Kirim pengingat untuk mengurangi ketidakhadiran.</div>
                </div>
              </div>
              <button onClick={() => showToast("📲 Pengingat WhatsApp otomatis dikirim ke 3 pasien!")} style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: "#0d9488", color: "#fff", fontSize: 11, fontWeight: 800, cursor: "pointer", flexShrink: 0 }}>Terapkan</button>
            </div>
          </div>

          <div style={{ marginTop: 14, textAlign: "center" }}>
            <button onClick={() => onNavigateTab?.("AI Assistant")} style={{ border: "none", background: "none", fontSize: 11.5, fontWeight: 800, color: "#7e22ce", cursor: "pointer" }}>
              Lihat semua rekomendasi AI →
            </button>
          </div>
        </div>

      </div>

      {/* ================= FOOTER STATS INDICATORS BAR ================= */}
      <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #f1f5f9", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
        
        {/* Indicator 1 */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center", color: "#0284c7" }}>
            <CalendarIcon style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: "#64748b", fontWeight: 700 }}>Total Appointment Hari Ini</div>
            <div style={{ fontSize: 14, fontWeight: 900, color: "#0f172a" }}>18 janji temu</div>
          </div>
        </div>

        {/* Indicator 2 */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", color: "#166534" }}>
            <UserCheck style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: "#64748b", fontWeight: 700 }}>Selesai</div>
            <div style={{ fontSize: 14, fontWeight: 900, color: "#15803d" }}>6 <span style={{ fontSize: 11, fontWeight: 600 }}>(33%)</span></div>
          </div>
        </div>

        {/* Indicator 3 */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center", color: "#c2410c" }}>
            <Activity style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: "#64748b", fontWeight: 700 }}>Berjalan</div>
            <div style={{ fontSize: 14, fontWeight: 900, color: "#c2410c" }}>7 <span style={{ fontSize: 11, fontWeight: 600 }}>(39%)</span></div>
          </div>
        </div>

        {/* Indicator 4 */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", color: "#d97706" }}>
            <Clock style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: "#64748b", fontWeight: 700 }}>Menunggu</div>
            <div style={{ fontSize: 14, fontWeight: 900, color: "#d97706" }}>5 <span style={{ fontSize: 11, fontWeight: 600 }}>(28%)</span></div>
          </div>
        </div>

        {/* Indicator 5 */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fce7f3", display: "flex", alignItems: "center", justifyContent: "center", color: "#be185d" }}>
            <User style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: "#64748b", fontWeight: 700 }}>Rata-rata No-Show</div>
            <div style={{ fontSize: 14, fontWeight: 900, color: "#be185d" }}>8% <span style={{ fontSize: 10, color: "#16a34a", fontWeight: 700 }}>↓ 2% dari kemarin</span></div>
          </div>
        </div>

      </div>

    </div>
  );
}
