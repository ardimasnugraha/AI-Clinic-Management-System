"use client";

import React, { useState, useEffect } from "react";
import { 
  Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Search, 
  Filter, Clock, User, CheckCircle2, XCircle, AlertCircle, Phone, 
  Stethoscope, Building2, Edit2, Trash2, Check, X, FileText, ArrowRight, RefreshCw, Eye
} from "lucide-react";
import { supabase, isConfigured } from "@/lib/supabase/client";
import { getStoredDoctors, addStoredDoctor, Doctor as StoreDoctor } from "@/lib/store";

const Container = ({ style, ...p }: any) => (
  <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e8f0fe", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", ...style }} {...p} />
);

export interface Appointment {
  id: string;
  patientId?: string;
  name: string;
  phone: string;
  poli: string;
  dokter: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  dur: number; // minutes
  status: "menunggu" | "berjalan" | "selesai" | "dibatalkan";
  notes?: string;
  col?: string;
  bg?: string;
}

const POLIS = ["Umum", "Gigi", "Jantung", "Kulit", "Anak", "Mata"];
const TIME_SLOTS = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00"];

// Get today's YYYY-MM-DD
const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Default seed data
const getInitialAppointments = (): Appointment[] => {
  return [];
};

const statusBadge = (s: string) => {
  const m: Record<string, [string, string, string]> = {
    selesai: ["#15803d", "#dcfce7", "Selesai"],
    berjalan: ["#7c3aed", "#ede9fe", "Berjalan"],
    menunggu: ["#c2410c", "#fff7ed", "Menunggu"],
    dibatalkan: ["#dc2626", "#fef2f2", "Dibatalkan"],
  };
  const [c, b, label] = m[s.toLowerCase()] || ["#64748b", "#f1f5f9", s];
  return (
    <span style={{ background: b, color: c, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c }} />
      {label}
    </span>
  );
};

interface AppointmentsViewProps {
  initialPatient?: { rm: string; name: string; phone: string } | null;
  onClearInitialPatient?: () => void;
}

export default function AppointmentsView({ initialPatient, onClearInitialPatient }: AppointmentsViewProps = {}) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [registeredPatients, setRegisteredPatients] = useState<any[]>([]);
  const [doctorsList, setDoctorsList] = useState<StoreDoctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<"list" | "week">("list");
  const [search, setSearch] = useState("");
  const [selStatus, setSelStatus] = useState("Semua");
  const [selPoli, setSelPoli] = useState("Semua");
  const [filterDate, setFilterDate] = useState("");

  // Modal States
  const [showForm, setShowForm] = useState(false);
  const [editAppt, setEditAppt] = useState<Appointment | null>(null);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Load dynamic doctors list
  useEffect(() => {
    setDoctorsList(getStoredDoctors());
  }, [showForm]);

  // Auto-open modal if navigated from Patients View with initialPatient
  useEffect(() => {
    const docs = getStoredDoctors();
    const defaultDoc = docs[0]?.name || "dr. Maya Lestari";
    const defaultPoli = docs[0]?.poli || "Umum";

    if (initialPatient && initialPatient.name) {
      setEditAppt(null);
      setFormData({
        patientId: initialPatient.rm || "",
        name: initialPatient.name || "",
        phone: initialPatient.phone || "",
        dokter: defaultDoc,
        poli: defaultPoli,
        date: getTodayStr(),
        time: "09:00",
        dur: 30,
        notes: `Appointment konsultasi untuk ${initialPatient.name}`
      });
      setShowForm(true);
      if (onClearInitialPatient) {
        onClearInitialPatient();
      }
    }
  }, [initialPatient, onClearInitialPatient]);

  // Week Calendar Navigation state (Stores starting date of week)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(now);
    monday.setDate(diffToMonday);
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  // Form Fields State
  const [formData, setFormData] = useState({
    patientId: "",
    name: "",
    phone: "",
    dokter: "dr. Maya Lestari",
    poli: "Umum",
    date: getTodayStr(),
    time: "09:00",
    dur: 30,
    notes: ""
  });

  // Toast Notification helper
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Load Initial Data from LocalStorage / Supabase
  useEffect(() => {
    const loadAppointments = async () => {
      setIsLoading(true);

      // Load Registered Patients list for autocomplete dropdown
      try {
        const localPatients = localStorage.getItem("clinic_patients_v1");
        if (localPatients) {
          const parsed = JSON.parse(localPatients);
          const realPatients = parsed.filter((p: any) => !p.rm?.startsWith("RM000123"));
          setRegisteredPatients(realPatients);
        } else {
          setRegisteredPatients([]);
        }
      } catch (e) {
        console.error("Failed loading patients", e);
      }

      // Check LocalStorage cache and filter out old dummy items
      const cached = localStorage.getItem("clinic_appointments_v1");
      if (cached) {
        try {
          const parsed: Appointment[] = JSON.parse(cached);
          const realAppts = parsed.filter(a => !a.id?.startsWith("APT00") && !a.patientId?.startsWith("RM000123"));
          setAppointments(realAppts);
          localStorage.setItem("clinic_appointments_v1", JSON.stringify(realAppts));
          setIsLoading(false);
          return;
        } catch (e) {
          console.error("Error parsing cached appointments", e);
        }
      }

      // Fallback or Supabase load
      if (isConfigured && supabase) {
        try {
          const { data, error } = await supabase.from("appointments").select("*");
          if (!error && data && data.length > 0) {
            const mapped: Appointment[] = data.map((item: any) => ({
              id: item.id || `APT${Math.floor(100+Math.random()*900)}`,
              patientId: item.patient_id,
              name: item.patient_name || item.name || "Pasien",
              phone: item.phone || "-",
              poli: item.poli || "Umum",
              dokter: item.doctor_name || "dr. Maya Lestari",
              date: item.scheduled_time ? item.scheduled_time.split("T")[0] : getTodayStr(),
              time: item.scheduled_time ? item.scheduled_time.split("T")[1]?.slice(0, 5) || "09:00" : "09:00",
              dur: 30,
              status: (item.status?.toLowerCase() as any) || "menunggu",
              notes: item.notes || ""
            }));
            setAppointments(mapped);
            localStorage.setItem("clinic_appointments_v1", JSON.stringify(mapped));
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.warn("Supabase fetch failed", err);
        }
      }

      setAppointments([]);
      localStorage.setItem("clinic_appointments_v1", JSON.stringify([]));
      setIsLoading(false);
    };

    loadAppointments();
  }, []);

  // Save changes to localStorage & DB helper
  const saveAppointments = (updated: Appointment[]) => {
    setAppointments(updated);
    try {
      localStorage.setItem("clinic_appointments_v1", JSON.stringify(updated));
    } catch (e) {
      console.error("Failed saving to localStorage", e);
    }
  };

  // Open Form modal for creation (or slot prefill)
  const handleOpenCreate = (prefillDate?: string, prefillTime?: string) => {
    const defaultDoc = doctorsList[0]?.name || "dr. Maya Lestari";
    const defaultPoli = doctorsList[0]?.poli || "Umum";
    setEditAppt(null);
    setFormData({
      patientId: "",
      name: "",
      phone: "",
      dokter: defaultDoc,
      poli: defaultPoli,
      date: prefillDate || getTodayStr(),
      time: prefillTime || "09:00",
      dur: 30,
      notes: ""
    });
    setShowForm(true);
  };

  // Open Form modal for edit
  const handleOpenEdit = (appt: Appointment) => {
    setEditAppt(appt);
    setFormData({
      patientId: appt.patientId || "",
      name: appt.name,
      phone: appt.phone || "",
      dokter: appt.dokter,
      poli: appt.poli,
      date: appt.date,
      time: appt.time,
      dur: appt.dur || 30,
      notes: appt.notes || ""
    });
    setShowForm(true);
    setSelectedAppt(null);
  };

  // Handle Patient selection in Form dropdown
  const handleSelectPatient = (patientRm: string) => {
    const found = registeredPatients.find(p => p.rm === patientRm);
    if (found) {
      setFormData(prev => ({
        ...prev,
        patientId: found.rm,
        name: found.name,
        phone: found.phone || ""
      }));
    }
  };

  // Handle Doctor selection in Form dropdown
  const handleSelectDoctor = (docName: string) => {
    const doc = doctorsList.find(d => d.name === docName);
    setFormData(prev => ({
      ...prev,
      dokter: docName,
      poli: doc ? doc.poli : prev.poli
    }));
  };

  // Submit Save Appointment (Create or Edit)
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Nama Pasien wajib diisi.");
      return;
    }

    const docObj = doctorsList.find(d => d.name === formData.dokter);
    const color = docObj ? docObj.color : "#0d9488";
    const bg = docObj ? docObj.bg : "#e0f2fe";

    if (editAppt) {
      // Update existing
      const updated = appointments.map(a => {
        if (a.id === editAppt.id) {
          return {
            ...a,
            patientId: formData.patientId,
            name: formData.name,
            phone: formData.phone,
            dokter: formData.dokter,
            poli: formData.poli,
            date: formData.date,
            time: formData.time,
            dur: Number(formData.dur),
            notes: formData.notes,
            col: color,
            bg: bg
          };
        }
        return a;
      });
      saveAppointments(updated);
      showToast(`Appointment ${editAppt.id} berhasil diperbarui!`);
    } else {
      // Create new
      const newId = `APT${String(appointments.length + 1).padStart(3, '0')}`;
      const newAppt: Appointment = {
        id: newId,
        patientId: formData.patientId || `RM000${Math.floor(1000 + Math.random() * 9000)}`,
        name: formData.name,
        phone: formData.phone || "0812-0000-0000",
        dokter: formData.dokter,
        poli: formData.poli,
        date: formData.date,
        time: formData.time,
        dur: Number(formData.dur),
        status: "menunggu",
        notes: formData.notes,
        col: color,
        bg: bg
      };
      saveAppointments([newAppt, ...appointments]);
      showToast(`Appointment ${newId} untuk ${formData.name} berhasil dibuat!`);
    }

    setShowForm(false);
  };

  // Change Appointment Status (Check-in, Selesai, Batalkan)
  const handleUpdateStatus = (id: string, newStatus: Appointment["status"]) => {
    const targetAppt = appointments.find(a => a.id === id);
    const updated = appointments.map(a => a.id === id ? { ...a, status: newStatus } : a);
    saveAppointments(updated);
    
    // If updating currently viewed appointment modal
    if (selectedAppt && selectedAppt.id === id) {
      setSelectedAppt({ ...selectedAppt, status: newStatus });
    }

    // Auto-push patient into Queue when Checked-In
    if (newStatus === "berjalan" && targetAppt) {
      try {
        const cachedQueueStr = localStorage.getItem("clinic_queue_v1");
        let currentQueue = cachedQueueStr ? JSON.parse(cachedQueueStr) : [];
        const existsInQueue = currentQueue.some((q: any) => q.name.toLowerCase() === targetAppt.name.toLowerCase() && q.poli === targetAppt.poli && q.status !== "selesai" && q.status !== "dibatalkan");
        
        if (!existsInQueue) {
          const prefixes: Record<string, string> = { Umum: "A", Gigi: "B", Jantung: "C", Mata: "D", Kulit: "E", Anak: "F" };
          const prefix = prefixes[targetAppt.poli] || "A";
          const matchingNos = currentQueue
            .map((q: any) => q.no)
            .filter((no: string) => no.startsWith(`${prefix}-`))
            .map((no: string) => parseInt(no.split("-")[1] || "0", 10))
            .filter((num: number) => !isNaN(num));
          
          const maxNum = matchingNos.length > 0 ? Math.max(...matchingNos) : 0;
          const nextNo = `${prefix}-${String(maxNum + 1).padStart(3, '0')}`;
          
          const newQueueItem = {
            id: `Q${String(currentQueue.length + 1).padStart(3, '0')}`,
            no: nextNo,
            patientId: targetAppt.patientId || `RM000${Math.floor(1000 + Math.random() * 9000)}`,
            name: targetAppt.name,
            phone: targetAppt.phone || "-",
            poli: targetAppt.poli,
            doctorName: targetAppt.dokter,
            status: "menunggu",
            wait: "05:00",
            avatar: targetAppt.name.split(" ").map(w => w[0]).slice(0, 2).join(""),
            color: targetAppt.col || "#0d9488",
            date: targetAppt.date,
            createdTime: targetAppt.time || "09:00"
          };

          currentQueue.push(newQueueItem);
          localStorage.setItem("clinic_queue_v1", JSON.stringify(currentQueue));
        }
      } catch (err) {
        console.error("Error auto-adding checked in appointment to queue", err);
      }
    }

    const statusNames: Record<string, string> = {
      berjalan: "Checked-In (Masuk Antrean Poli)",
      selesai: "Selesai",
      dibatalkan: "Dibatalkan",
      menunggu: "Menunggu"
    };

    showToast(`Status Appointment ${id} diubah menjadi: ${statusNames[newStatus]}`);
  };

  // Delete Appointment
  const handleDeleteAppointment = (id: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus appointment ${id}?`)) {
      const updated = appointments.filter(a => a.id !== id);
      saveAppointments(updated);
      if (selectedAppt?.id === id) setSelectedAppt(null);
      showToast(`Appointment ${id} telah dihapus.`);
    }
  };

  // Filter Logic
  const filtered = appointments.filter(a => {
    const matchSearch = 
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.dokter.toLowerCase().includes(search.toLowerCase()) ||
      a.poli.toLowerCase().includes(search.toLowerCase()) ||
      a.id.toLowerCase().includes(search.toLowerCase());
    
    const matchStatus = selStatus === "Semua" || a.status === selStatus.toLowerCase();
    const matchPoli = selPoli === "Semua" || a.poli === selPoli;
    const matchDate = !filterDate || a.date === filterDate;

    return matchSearch && matchStatus && matchPoli && matchDate;
  });

  // Calculate Stat Card Numbers (for today)
  const todayStr = getTodayStr();
  const todayAppts = appointments.filter(a => a.date === todayStr);
  const totalTodayCount = todayAppts.length;
  const selesaiCount = todayAppts.filter(a => a.status === "selesai").length;
  const berjalanCount = todayAppts.filter(a => a.status === "berjalan").length;
  const dibatalkanCount = todayAppts.filter(a => a.status === "dibatalkan").length;
  const menungguCount = todayAppts.filter(a => a.status === "menunggu").length;

  // Week Calendar dates (Monday to Saturday - 6 days)
  const getWeekDates = (startMonday: Date) => {
    const days = [];
    const dayNames = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    for (let i = 0; i < 6; i++) {
      const d = new Date(startMonday);
      d.setDate(startMonday.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dateVal = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dateVal}`;
      const displayLabel = `${dayNames[i]}, ${d.getDate()} ${d.toLocaleString('id-ID', { month: 'short' })}`;
      days.push({ dayName: dayNames[i], dateStr, displayLabel, isToday: dateStr === todayStr });
    }
    return days;
  };

  const weekDays = getWeekDates(currentWeekStart);

  const handleWeekNav = (dir: "prev" | "next" | "today") => {
    if (dir === "today") {
      const now = new Date();
      const day = now.getDay();
      const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now);
      monday.setDate(diffToMonday);
      monday.setHours(0, 0, 0, 0);
      setCurrentWeekStart(monday);
    } else {
      const nextMon = new Date(currentWeekStart);
      nextMon.setDate(currentWeekStart.getDate() + (dir === "next" ? 7 : -7));
      setCurrentWeekStart(nextMon);
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
          <CheckCircle2 style={{ width: 18, height: 18, color: "#22c55e" }} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>Manajemen Appointment</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "2px 0 0" }}>Kelola jadwal konsultasi, reservasi pasien, dan antrean poli</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => handleOpenCreate()} 
            style={{ 
              display: "flex", alignItems: "center", gap: 8, background: "#0d9488", color: "#fff", 
              border: "none", borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 700, 
              cursor: "pointer", boxShadow: "0 4px 12px rgba(13,148,136,0.3)", transition: "all 0.2s" 
            }}>
            <Plus style={{ width: 16, height: 16 }} /> Buat Appointment
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        {[
          { label: "Total Hari Ini", val: totalTodayCount, sub: `Menunggu: ${menungguCount}`, color: "#0d9488", bg: "#e0f2fe", icon: CalendarIcon },
          { label: "Selesai Hari Ini", val: selesaiCount, sub: "Telah Diperiksa", color: "#22c55e", bg: "#f0fdf4", icon: CheckCircle2 },
          { label: "Sedang Berjalan", val: berjalanCount, sub: "Di Ruang Dokter", color: "#8b5cf6", bg: "#ede9fe", icon: Clock },
          { label: "Dibatalkan", val: dibatalkanCount, sub: "Batal / Reschedule", color: "#ef4444", bg: "#fef2f2", icon: XCircle },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <Container key={i} style={{ padding: 18, display: "flex", alignItems: "center", justifyBetween: "space-between", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon style={{ width: 22, height: 22, color: s.color }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, color: "#64748b", fontWeight: 600, margin: 0 }}>{s.label}</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 2 }}>
                  <h3 style={{ fontSize: 24, fontWeight: 800, color: s.color, margin: 0 }}>{s.val}</h3>
                  <span style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 500 }}>{s.sub}</span>
                </div>
              </div>
            </Container>
          );
        })}
      </div>

      {/* Filter Toolbar & View Toggle */}
      <Container style={{ padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
            <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "#94a3b8" }} />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Cari nama pasien, dokter, poli..."
              style={{ width: "100%", paddingLeft: 36, paddingRight: 16, paddingTop: 8.5, paddingBottom: 8.5, borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8fafc", fontSize: 12.5, color: "#1e293b", outline: "none" }} 
            />
          </div>

          {/* Poli Dropdown filter */}
          <select 
            value={selPoli} 
            onChange={e => setSelPoli(e.target.value)}
            style={{ padding: "8.5px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 12.5, fontWeight: 600, color: "#475569", outline: "none", cursor: "pointer" }}>
            <option value="Semua">Semua Poli</option>
            {POLIS.map(p => <option key={p} value={p}>Poli {p}</option>)}
          </select>

          {/* Date Picker filter */}
          <input 
            type="date" 
            value={filterDate} 
            onChange={e => setFilterDate(e.target.value)}
            style={{ padding: "7.5px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 12, color: "#475569", outline: "none", cursor: "pointer" }} 
          />
          {filterDate && (
            <button onClick={() => setFilterDate("")} style={{ border: "none", background: "#f1f5f9", borderRadius: 8, padding: "6px 10px", fontSize: 11, fontWeight: 600, color: "#64748b", cursor: "pointer" }}>
              Reset Tgl
            </button>
          )}

          {/* Status buttons */}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {["Semua", "Menunggu", "Berjalan", "Selesai", "Dibatalkan"].map(s => (
              <button 
                key={s} 
                onClick={() => setSelStatus(s)}
                style={{ 
                  padding: "6px 12px", borderRadius: 10, border: "1.5px solid", fontSize: 11.5, fontWeight: 600, cursor: "pointer",
                  borderColor: selStatus === s ? "#0d9488" : "#e2e8f0",
                  background: selStatus === s ? "#0d9488" : "#fff",
                  color: selStatus === s ? "#fff" : "#64748b"
                }}>
                {s}
              </button>
            ))}
          </div>

          {/* View Toggle */}
          <div style={{ display: "flex", borderRadius: 10, border: "1px solid #e2e8f0", overflow: "hidden", marginLeft: "auto" }}>
            {(["list", "week"] as const).map(v => (
              <button 
                key={v} 
                onClick={() => setView(v)} 
                style={{ padding: "7px 16px", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", background: view === v ? "#0d9488" : "#fff", color: view === v ? "#fff" : "#64748b" }}>
                {v === "list" ? "Daftar" : "Kalender Mingguan"}
              </button>
            ))}
          </div>
        </div>
      </Container>

      {/* Main Content Area */}
      {view === "list" ? (
        /* List View */
        <Container style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["ID", "Tanggal & Jam", "Pasien", "Poli", "Dokter", "Catatan Keluhan", "Status", "Aksi"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#64748b", borderBottom: "1px solid #e8f0fe", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: 40, color: "#94a3b8", fontSize: 13 }}>
                      Tidak ada data appointment yang cocok dengan kriteria filter.
                    </td>
                  </tr>
                ) : (
                  filtered.map((a) => (
                    <tr key={a.id} style={{ borderBottom: "1px solid #f8fafc", transition: "background 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#f0f9ff")}
                      onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
                      
                      {/* ID */}
                      <td style={{ padding: "12px 16px", color: "#0d9488", fontWeight: 700, fontSize: 12.5 }}>
                        {a.id}
                      </td>

                      {/* Date & Time */}
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ color: "#0f172a", fontWeight: 700, fontSize: 12.5, display: "flex", alignItems: "center", gap: 5 }}>
                          <Clock style={{ width: 13, height: 13, color: "#94a3b8" }} />
                          {a.time}
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                          {a.date === todayStr ? <strong style={{ color: "#0d9488" }}>Hari Ini</strong> : a.date}
                        </div>
                      </td>

                      {/* Patient Info */}
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: a.col || "#0d9488", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                            {a.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 13 }}>{a.name}</div>
                            <div style={{ fontSize: 10.5, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}>
                              <span>{a.patientId || "RM-"}</span> • <span>{a.phone}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Poli Badge */}
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ background: a.bg || "#e0f2fe", color: a.col || "#0d9488", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                          Poli {a.poli}
                        </span>
                      </td>

                      {/* Doctor */}
                      <td style={{ padding: "12px 16px", color: "#334155", fontWeight: 600, fontSize: 12.5 }}>
                        {a.dokter}
                      </td>

                      {/* Notes */}
                      <td style={{ padding: "12px 16px", color: "#64748b", fontSize: 12, maxWidth: 180 }}>
                        <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {a.notes || "-"}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "12px 16px" }}>
                        {statusBadge(a.status)}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <button 
                            onClick={() => setSelectedAppt(a)}
                            title="Lihat Detail"
                            style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", fontSize: 11, fontWeight: 600, color: "#334155", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                            <Eye style={{ width: 12, height: 12 }} /> Detail
                          </button>

                          {a.status === "menunggu" && (
                            <button 
                              onClick={() => handleUpdateStatus(a.id, "berjalan")}
                              style={{ padding: "5px 10px", borderRadius: 8, border: "none", background: "#0d9488", fontSize: 11, fontWeight: 700, color: "#fff", cursor: "pointer" }}>
                              Check-In
                            </button>
                          )}

                          {a.status === "berjalan" && (
                            <button 
                              onClick={() => handleUpdateStatus(a.id, "selesai")}
                              style={{ padding: "5px 10px", borderRadius: 8, border: "none", background: "#16a34a", fontSize: 11, fontWeight: 700, color: "#fff", cursor: "pointer" }}>
                              Selesai
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Container>
      ) : (
        /* Interactive Weekly Calendar View */
        <Container style={{ padding: 20, overflow: "auto" }}>
          {/* Calendar Controls */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button 
                onClick={() => handleWeekNav("prev")}
                style={{ padding: "7px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#475569" }}>
                <ChevronLeft style={{ width: 14, height: 14 }} /> Minggu Lalu
              </button>

              <button 
                onClick={() => handleWeekNav("today")}
                style={{ padding: "7px 14px", borderRadius: 10, border: "1.5px solid #0d9488", background: "#f0fdf4", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#0d9488" }}>
                Hari Ini
              </button>

              <button 
                onClick={() => handleWeekNav("next")}
                style={{ padding: "7px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#475569" }}>
                Minggu Depan <ChevronRight style={{ width: 14, height: 14 }} />
              </button>
            </div>

            <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>
              {weekDays[0].displayLabel} — {weekDays[weekDays.length - 1].displayLabel}
            </h3>

            <div style={{ fontSize: 11.5, color: "#64748b" }}>
              💡 *Klik slot kosong untuk menambah appointment*
            </div>
          </div>

          {/* Calendar Grid Header */}
          <div style={{ display: "grid", gridTemplateColumns: `70px repeat(${weekDays.length}, 1fr)`, gap: 6, minWidth: 780 }}>
            {/* Time Header Column */}
            <div style={{ textAlign: "center", padding: "10px 4px", fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>
              Jam
            </div>

            {/* Day Header Columns */}
            {weekDays.map((d, idx) => (
              <div 
                key={idx} 
                style={{ 
                  textAlign: "center", padding: "10px 6px", borderRadius: 10, 
                  background: d.isToday ? "#0d9488" : "#f8fafc", 
                  color: d.isToday ? "#fff" : "#334155",
                  border: d.isToday ? "none" : "1px solid #e2e8f0"
                }}>
                <div style={{ fontSize: 12, fontWeight: 800 }}>{d.dayName}</div>
                <div style={{ fontSize: 10.5, opacity: 0.9, marginTop: 2 }}>{d.dateStr}</div>
              </div>
            ))}

            {/* Time Grid Rows */}
            {TIME_SLOTS.map((timeSlot) => (
              <React.Fragment key={timeSlot}>
                {/* Time Label */}
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, paddingTop: 8, textAlign: "right", paddingRight: 8 }}>
                  {timeSlot}
                </div>

                {/* Day Slots */}
                {weekDays.map((dayObj, dIdx) => {
                  // Find appointments matching date & time
                  const slotAppts = appointments.filter(a => a.date === dayObj.dateStr && a.time === timeSlot);

                  return (
                    <div 
                      key={dIdx}
                      onClick={() => {
                        if (slotAppts.length === 0) {
                          handleOpenCreate(dayObj.dateStr, timeSlot);
                        }
                      }}
                      style={{ 
                        minHeight: 52, borderRadius: 10, 
                        background: slotAppts.length > 0 ? "#fff" : "#fafafa", 
                        border: "1px dashed #e2e8f0", 
                        padding: 4, cursor: slotAppts.length === 0 ? "pointer" : "default",
                        transition: "all 0.15s",
                        display: "flex", flexDirection: "column", gap: 4
                      }}
                      onMouseEnter={e => {
                        if (slotAppts.length === 0) (e.currentTarget as HTMLElement).style.background = "#f0fdf4";
                      }}
                      onMouseLeave={e => {
                        if (slotAppts.length === 0) (e.currentTarget as HTMLElement).style.background = "#fafafa";
                      }}>
                      
                      {slotAppts.map((apt) => (
                        <div 
                          key={apt.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAppt(apt);
                          }}
                          style={{ 
                            background: apt.bg || "#e0f2fe", 
                            borderLeft: `4px solid ${apt.col || "#0d9488"}`,
                            borderRadius: 6, padding: "5px 8px", cursor: "pointer",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
                          }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>
                            {apt.name}
                          </div>
                          <div style={{ fontSize: 10, color: apt.col || "#0d9488", fontWeight: 700, marginTop: 2, display: "flex", justifyContent: "space-between" }}>
                            <span>Poli {apt.poli}</span>
                            <span style={{ fontSize: 9 }}>{apt.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </Container>
      )}

      {/* CREATE / EDIT APPOINTMENT MODAL */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <Container style={{ width: 520, padding: 26, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  {editAppt ? `Edit Appointment (${editAppt.id})` : "Buat Appointment Baru"}
                </h2>
                <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>
                  {editAppt ? "Perbarui detail jadwal appointment pasien" : "Daftarkan jadwal konsultasi pasien baru"}
                </p>
              </div>
              <button onClick={() => setShowForm(false)} style={{ border: "none", background: "#f1f5f9", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13, color: "#64748b", fontWeight: 700 }}>✕</button>
            </div>

            <form onSubmit={handleSubmitForm} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Select Registered Patient */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>
                  Pilih Pasien Terdaftar (Opsional)
                </label>
                <select 
                  onChange={e => handleSelectPatient(e.target.value)}
                  style={{ width: "100%", padding: "9.5px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8fafc", fontSize: 13, color: "#1e293b", outline: "none" }}>
                  <option value="">-- Cari / Pilih Pasien Terdaftar --</option>
                  {registeredPatients.map(p => (
                    <option key={p.rm} value={p.rm}>{p.name} ({p.rm}) — {p.phone}</option>
                  ))}
                </select>
              </div>

              {/* Nama Pasien */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>
                  Nama Lengkap Pasien <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ketik nama pasien..."
                  style={{ width: "100%", padding: "9.5px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13, color: "#1e293b", outline: "none" }} 
                />
              </div>

              {/* Nomor HP */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>
                  Nomor HP / Whatsapp Pasien
                </label>
                <input 
                  type="text" 
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Contoh: 0812-3456-7890"
                  style={{ width: "100%", padding: "9.5px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13, color: "#1e293b", outline: "none" }} 
                />
              </div>

              {/* Dokter & Poli Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>
                    Dokter Pemeriksa
                  </label>
                  <select 
                    value={formData.dokter}
                    onChange={e => handleSelectDoctor(e.target.value)}
                    style={{ width: "100%", padding: "9.5px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13, color: "#1e293b", outline: "none" }}>
                    {doctorsList.map(d => (
                      <option key={d.id || d.name} value={d.name}>{d.name} (Poli {d.poli})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>
                    Poli / Spesialisasi
                  </label>
                  <select 
                    value={formData.poli}
                    onChange={e => setFormData({ ...formData, poli: e.target.value })}
                    style={{ width: "100%", padding: "9.5px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13, color: "#1e293b", outline: "none" }}>
                    {POLIS.map(p => (
                      <option key={p} value={p}>Poli {p}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tanggal, Jam, Durasi */}
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Tanggal</label>
                  <input 
                    type="date" 
                    required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    style={{ width: "100%", padding: "9.5px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 12.5, color: "#1e293b", outline: "none" }} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Jam Slot</label>
                  <select 
                    value={formData.time}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                    style={{ width: "100%", padding: "9.5px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 12.5, color: "#1e293b", outline: "none" }}>
                    {TIME_SLOTS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Durasi</label>
                  <select 
                    value={formData.dur}
                    onChange={e => setFormData({ ...formData, dur: Number(e.target.value) })}
                    style={{ width: "100%", padding: "9.5px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 12.5, color: "#1e293b", outline: "none" }}>
                    <option value={15}>15 Menit</option>
                    <option value={30}>30 Menit</option>
                    <option value={45}>45 Menit</option>
                    <option value={60}>60 Menit</option>
                  </select>
                </div>
              </div>

              {/* Catatan / Keluhan */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>
                  Keluhan Pasien / Catatan Tambahan
                </label>
                <textarea 
                  rows={3}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Keluhan utama atau instruksi khusus..."
                  style={{ width: "100%", padding: "9.5px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13, color: "#1e293b", outline: "none", resize: "vertical" }} 
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowForm(false)} 
                  style={{ flex: 1, padding: "10.5px 0", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 700, color: "#64748b", cursor: "pointer" }}>
                  Batal
                </button>
                <button type="submit" 
                  style={{ flex: 2, padding: "10.5px 0", borderRadius: 10, border: "none", background: "#0d9488", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", boxShadow: "0 4px 12px rgba(13,148,136,0.3)" }}>
                  {editAppt ? "Simpan Perubahan" : "Buat Appointment"}
                </button>
              </div>
            </form>
          </Container>
        </div>
      )}

      {/* DETAIL APPOINTMENT MODAL */}
      {selectedAppt && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <Container style={{ width: 480, padding: 26, maxHeight: "90vh", overflowY: "auto" }}>
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1px solid #f1f5f9", paddingBottom: 14 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#0d9488", background: "#e0f2fe", padding: "2px 8px", borderRadius: 6 }}>
                  {selectedAppt.id}
                </span>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "4px 0 0" }}>
                  Detail Appointment
                </h2>
              </div>
              <button onClick={() => setSelectedAppt(null)} style={{ border: "none", background: "#f1f5f9", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13, color: "#64748b", fontWeight: 700 }}>✕</button>
            </div>

            {/* Patient Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, background: "#f8fafc", padding: 16, borderRadius: 12, marginBottom: 18 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: selectedAppt.col || "#0d9488", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                {selectedAppt.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>{selectedAppt.name}</h3>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                  {selectedAppt.patientId || "RM-"} • {selectedAppt.phone}
                </div>
              </div>
              <div>
                {statusBadge(selectedAppt.status)}
              </div>
            </div>

            {/* Detail Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>Dokter Pemeriksa</div>
                <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 700, marginTop: 2 }}>{selectedAppt.dokter}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>Poli / Departemen</div>
                <div style={{ fontSize: 13, color: "#0d9488", fontWeight: 700, marginTop: 2 }}>Poli {selectedAppt.poli}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>Tanggal Konsultasi</div>
                <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 700, marginTop: 2 }}>{selectedAppt.date}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>Waktu & Durasi</div>
                <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 700, marginTop: 2 }}>{selectedAppt.time} ({selectedAppt.dur || 30} m)</div>
              </div>
            </div>

            {/* Notes */}
            <div style={{ background: "#fff7ed", border: "1px solid #ffedd5", borderRadius: 12, padding: 14, marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#c2410c", marginBottom: 4 }}>Keluhan / Catatan Pasien:</div>
              <p style={{ fontSize: 12.5, color: "#431407", margin: 0, lineHeight: 1.5 }}>
                {selectedAppt.notes || "Tidak ada catatan keluhan khusus."}
              </p>
            </div>

            {/* Action Buttons Workflow */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", gap: 8 }}>
                {selectedAppt.status === "menunggu" && (
                  <button 
                    onClick={() => handleUpdateStatus(selectedAppt.id, "berjalan")}
                    style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "#0d9488", color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <Check style={{ width: 14, height: 14 }} /> Check-In Sekarang
                  </button>
                )}

                {selectedAppt.status === "berjalan" && (
                  <button 
                    onClick={() => handleUpdateStatus(selectedAppt.id, "selesai")}
                    style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "#16a34a", color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <CheckCircle2 style={{ width: 14, height: 14 }} /> Tandai Selesai
                  </button>
                )}

                <button 
                  onClick={() => handleOpenEdit(selectedAppt)}
                  style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid #cbd5e1", background: "#fff", color: "#334155", fontSize: 12.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Edit2 style={{ width: 14, height: 14 }} /> Edit Schedule
                </button>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                {selectedAppt.status !== "dibatalkan" && (
                  <button 
                    onClick={() => handleUpdateStatus(selectedAppt.id, "dibatalkan")}
                    style={{ flex: 1, padding: "9px", borderRadius: 10, border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    Batalkan Appointment
                  </button>
                )}

                <button 
                  onClick={() => handleDeleteAppointment(selectedAppt.id)}
                  style={{ flex: 1, padding: "9px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Trash2 style={{ width: 13, height: 13 }} /> Hapus Data
                </button>
              </div>
            </div>
          </Container>
        </div>
      )}
    </div>
  );
}
