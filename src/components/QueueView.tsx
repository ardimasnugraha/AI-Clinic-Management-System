"use client";

import React, { useState, useEffect } from "react";
import { 
  Clock, Users, CheckCircle2, Volume2, SkipForward, Printer, Search, 
  Bell, AlertTriangle, TrendingUp, Plus, Check, X, Eye, Phone, RefreshCw, Filter, Trash2, Calendar
} from "lucide-react";
import { supabase, isConfigured } from "@/lib/supabase/client";

const Container = ({ style, ...p }: any) => (
  <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e8f0fe", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", ...style }} {...p} />
);

export interface QueueItem {
  id: string;
  no: string; // e.g. "A-011", "B-002"
  patientId?: string;
  name: string;
  phone?: string;
  poli: string; // e.g. "Umum", "Gigi", "Jantung", "Mata", "Kulit", "Anak"
  doctorName?: string;
  status: "menunggu" | "dipanggil" | "selesai" | "dibatalkan";
  wait: string;
  avatar?: string;
  color?: string;
  date?: string; // YYYY-MM-DD
  createdTime?: string; // HH:MM
}

const POLI_CONFIG: Record<string, { prefix: string; color: string; bg: string; doctor: string }> = {
  Umum: { prefix: "A", color: "#0d9488", bg: "#e0f2fe", doctor: "dr. Maya Lestari" },
  Gigi: { prefix: "B", color: "#8b5cf6", bg: "#ede9fe", doctor: "drg. Sari Dewi" },
  Jantung: { prefix: "C", color: "#f97316", bg: "#fff7ed", doctor: "dr. Ahmad Rizki" },
  Mata: { prefix: "D", color: "#3b82f6", bg: "#eff6ff", doctor: "dr. Hendra Kusuma" },
  Kulit: { prefix: "E", color: "#ec4899", bg: "#fdf2f8", doctor: "dr. Laila Rahmawati" },
  Anak: { prefix: "F", color: "#22c55e", bg: "#f0fdf4", doctor: "dr. Rudi Setiawan" },
};

const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getCurrentTimeStr = () => {
  const d = new Date();
  return String(d.getHours()).padStart(2, '0') + ":" + String(d.getMinutes()).padStart(2, '0');
};

const getInitialQueue = (): QueueItem[] => [];

const statusBadge = (s: string) => {
  const m: Record<string, [string, string, string]> = {
    selesai: ["#15803d", "#dcfce7", "Selesai"],
    dipanggil: ["#1d4ed8", "#dbeafe", "Dipanggil"],
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

// Web Audio API Chime sound
const playChime = () => {
  if (typeof window === "undefined") return Promise.resolve();
  return new Promise<void>((resolve) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        resolve();
        return;
      }
      const ctx = new AudioCtx();
      
      const playNote = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      // Play chime: E5 note followed by C5 note
      playNote(659.25, ctx.currentTime, 0.6);
      playNote(523.25, ctx.currentTime + 0.3, 0.8);
      
      setTimeout(() => {
        resolve();
      }, 1000);
    } catch (e) {
      resolve();
    }
  });
};

// Text-to-Speech audio call (Indonesian voice)
const speakCall = async (no: string, name: string, poli: string) => {
  await playChime();

  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  const letterPart = no.split("-")[0] || "";
  const numberPart = no.split("-")[1] || "";
  const spelledDigits = numberPart.split("").map(char => char === "0" ? "kosong" : char).join(" ");

  const text = `Nomor antrean ${letterPart} ${spelledDigits}, ${name}, silakan menuju ke Poli ${poli}`;
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "id-ID";
  utterance.rate = 0.85;
  utterance.pitch = 1.0;

  const voices = window.speechSynthesis.getVoices();
  const idVoice = voices.find(v => v.lang.startsWith("id"));
  if (idVoice) {
    utterance.voice = idVoice;
  }

  window.speechSynthesis.speak(utterance);
};

export default function QueueView() {
  const [queueList, setQueueList] = useState<QueueItem[]>([]);
  const [registeredPatients, setRegisteredPatients] = useState<any[]>([]);
  const [selFilter, setSelFilter] = useState("Semua");
  const [selPoliFilter, setSelPoliFilter] = useState("Semua");
  const [search, setSearch] = useState("");
  const [currentNo, setCurrentNo] = useState("A-013");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPrintTicket, setShowPrintTicket] = useState<QueueItem | null>(null);

  // Form State for New Ticket
  const [newTicketData, setNewTicketData] = useState({
    patientId: "",
    name: "",
    phone: "",
    poli: "Umum"
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Load Queue Data from LocalStorage / Supabase
  useEffect(() => {
    const loadQueue = () => {
      // Patients list for autocomplete
      try {
        const localPatients = localStorage.getItem("clinic_patients_v1");
        if (localPatients) {
          setRegisteredPatients(JSON.parse(localPatients));
        } else {
          setRegisteredPatients([
            { rm: "RM0001234", name: "Andi Pratama", phone: "0812-3456-7890" },
            { rm: "RM0001235", name: "Siti Nurhaliza", phone: "0812-1122-3344" },
            { rm: "RM0001236", name: "Budi Santoso", phone: "0812-5566-7788" },
            { rm: "RM0001237", name: "Dewi Sartika", phone: "0813-2233-4455" },
            { rm: "RM0001238", name: "Hendra Wijaya", phone: "0812-9988-7766" },
          ]);
        }
      } catch (e) {
        console.error("Error loading patients", e);
      }

      // LocalStorage Queue
      const cached = localStorage.getItem("clinic_queue_v1");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.length > 0) {
            setQueueList(parsed);
            const activeCalled = parsed.find((q: QueueItem) => q.status === "dipanggil");
            if (activeCalled) {
              setCurrentNo(activeCalled.no);
            }
            return;
          }
        } catch (e) {
          console.error("Failed parsing cached queue", e);
        }
      }

      // Default Seed
      const initial = getInitialQueue();
      setQueueList(initial);
      localStorage.setItem("clinic_queue_v1", JSON.stringify(initial));
    };

    loadQueue();
  }, []);

  // Sync state to LocalStorage
  const saveQueue = (updated: QueueItem[]) => {
    setQueueList(updated);
    try {
      localStorage.setItem("clinic_queue_v1", JSON.stringify(updated));
    } catch (e) {
      console.error("Failed saving queue to localStorage", e);
    }
  };

  // Generate Next Queue Number for a given Poli
  const generateNextQueueNo = (poliName: string): string => {
    const config = POLI_CONFIG[poliName] || { prefix: "A" };
    const prefix = config.prefix;

    // Find all items with matching prefix
    const matchingNos = queueList
      .map(q => q.no)
      .filter(no => no.startsWith(`${prefix}-`))
      .map(no => parseInt(no.split("-")[1] || "0", 10))
      .filter(num => !isNaN(num));

    const maxNum = matchingNos.length > 0 ? Math.max(...matchingNos) : 0;
    const nextNum = maxNum + 1;
    return `${prefix}-${String(nextNum).padStart(3, '0')}`;
  };

  // Call Next Patient
  const handleNext = () => {
    // Find next pending patient
    const nextPending = queueList.find(q => {
      const matchPoli = selPoliFilter === "Semua" || q.poli === selPoliFilter;
      return q.status === "menunggu" && matchPoli;
    });

    if (nextPending) {
      setCurrentNo(nextPending.no);
      const updated = queueList.map(item => {
        if (item.no === nextPending.no) return { ...item, status: "dipanggil" as const };
        if (item.no === currentNo && item.status === "dipanggil") return { ...item, status: "selesai" as const };
        return item;
      });
      saveQueue(updated);
      speakCall(nextPending.no, nextPending.name, nextPending.poli);
      showToast(`Memanggil nomor antrean ${nextPending.no} (${nextPending.name})`);
    } else {
      showToast("Tidak ada antrean pasien yang menunggu dalam antrean saat ini.");
    }
  };

  // Call Specific Patient
  const handleCallSpecific = (item: QueueItem) => {
    setCurrentNo(item.no);
    const updated = queueList.map(q => {
      if (q.id === item.id) return { ...q, status: "dipanggil" as const };
      if (q.no === currentNo && q.status === "dipanggil") return { ...q, status: "selesai" as const };
      return q;
    });
    saveQueue(updated);
    speakCall(item.no, item.name, item.poli);
    showToast(`Memanggil ${item.no} - ${item.name} (Poli ${item.poli})`);
  };

  // Complete / Check-In Current Patient
  const handleCompleteCurrent = (noToComplete?: string) => {
    const targetNo = noToComplete || currentNo;
    const updated = queueList.map(q => q.no === targetNo ? { ...q, status: "selesai" as const, wait: "—" } : q);
    saveQueue(updated);
    showToast(`Antrean ${targetNo} ditandai Selesai / Checked-In ke Dokter`);
  };

  // Cancel Queue Item
  const handleCancelQueue = (id: string) => {
    if (confirm("Apakah Anda yakin ingin membatalkan nomor antrean ini?")) {
      const updated = queueList.map(q => q.id === id ? { ...q, status: "dibatalkan" as const, wait: "—" } : q);
      saveQueue(updated);
      showToast("Nomor antrean telah dibatalkan.");
    }
  };

  // Submit New Ticket Modal
  const handleCreateTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketData.name.trim()) {
      alert("Nama Pasien wajib diisi.");
      return;
    }

    const poliConfig = POLI_CONFIG[newTicketData.poli] || POLI_CONFIG["Umum"];
    const nextNo = generateNextQueueNo(newTicketData.poli);
    const avatar = newTicketData.name.split(" ").map(w => w[0]).slice(0, 2).join("");

    const newTicket: QueueItem = {
      id: `Q${String(queueList.length + 1).padStart(3, '0')}`,
      no: nextNo,
      patientId: newTicketData.patientId || `RM000${Math.floor(1000 + Math.random() * 9000)}`,
      name: newTicketData.name,
      phone: newTicketData.phone || "0812-0000-0000",
      poli: newTicketData.poli,
      doctorName: poliConfig.doctor,
      status: "menunggu",
      wait: "05:00",
      avatar: avatar,
      color: poliConfig.color,
      date: getTodayStr(),
      createdTime: getCurrentTimeStr()
    };

    const updated = [...queueList, newTicket];
    saveQueue(updated);
    setShowAddModal(false);
    showToast(`Tiket Antrean ${nextNo} berhasil dibuat untuk ${newTicketData.name}!`);

    // Show Print preview for new ticket
    setShowPrintTicket(newTicket);
  };

  // Handle Registered Patient selection in Add Modal
  const handleSelectRegisteredPatient = (patientRm: string) => {
    const found = registeredPatients.find(p => p.rm === patientRm);
    if (found) {
      setNewTicketData(prev => ({
        ...prev,
        patientId: found.rm,
        name: found.name,
        phone: found.phone || ""
      }));
    }
  };

  // Filter Logic
  const filteredQueue = queueList.filter(q => {
    const matchSearch = 
      q.name.toLowerCase().includes(search.toLowerCase()) ||
      q.no.toLowerCase().includes(search.toLowerCase()) ||
      q.poli.toLowerCase().includes(search.toLowerCase());
    
    const matchStatus = selFilter === "Semua" || q.status === selFilter.toLowerCase();
    const matchPoli = selPoliFilter === "Semua" || q.poli === selPoliFilter;

    return matchSearch && matchStatus && matchPoli;
  });

  const currentPatient = queueList.find(q => q.no === currentNo) || {
    no: "A-000",
    name: "Belum Ada Pasien Dipanggil",
    poli: "Umum",
    doctorName: "dr. Maya Lestari"
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
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>Manajemen Antrean Klinik</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "2px 0 0" }}>Monitor panggilan loket, cetak tiket antrean, dan alur pelayanan poli real-time</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button 
            onClick={() => {
              if (queueList.length > 0) setShowPrintTicket(queueList[queueList.length - 1]);
              else alert("Belum ada antrean untuk dicetak.");
            }} 
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 12, border: "1px solid #cbd5e1", background: "#fff", fontSize: 13, fontWeight: 600, color: "#475569", cursor: "pointer" }}>
            <Printer style={{ width: 15, height: 15 }} /> Cetak Tiket
          </button>
          
          <button 
            onClick={() => {
              setNewTicketData({ patientId: "", name: "", phone: "", poli: "Umum" });
              setShowAddModal(true);
            }} 
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 12, border: "1.5px solid #0d9488", background: "#f0fdf4", fontSize: 13, fontWeight: 700, color: "#0d9488", cursor: "pointer" }}>
            <Plus style={{ width: 15, height: 15 }} /> Ambil Tiket Baru
          </button>

          <button 
            onClick={handleNext} 
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 12, border: "none", background: "#0d9488", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", boxShadow: "0 4px 12px rgba(13,148,136,0.3)" }}>
            <SkipForward style={{ width: 15, height: 15 }} /> Panggil Berikutnya
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        {[
          { label: "Total Antrean Hari Ini", val: queueList.length, color: "#0d9488", bg: "#e0f2fe", icon: Users },
          { label: "Menunggu Dipanggil", val: queueList.filter(q => q.status === "menunggu").length, color: "#f97316", bg: "#fff7ed", icon: Clock },
          { label: "Sedang Dipanggil", val: queueList.filter(q => q.status === "dipanggil").length, color: "#3b82f6", bg: "#eff6ff", icon: Bell },
          { label: "Selesai Pelayanan", val: queueList.filter(q => q.status === "selesai").length, color: "#22c55e", bg: "#f0fdf4", icon: CheckCircle2 },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <Container key={i} style={{ padding: 18, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon style={{ width: 22, height: 22, color: s.color }} />
              </div>
              <div>
                <p style={{ fontSize: 12, color: "#64748b", fontWeight: 600, margin: 0 }}>{s.label}</p>
                <h3 style={{ fontSize: 26, fontWeight: 800, color: s.color, margin: 0 }}>{s.val}</h3>
              </div>
            </Container>
          );
        })}
      </div>

      {/* Main Layout: Now Serving Display (Left) + Queue List Table (Right) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>
        {/* Now Serving Display Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Main Calling Box */}
          <div style={{ background: "linear-gradient(135deg, #0ea5e9, #0d9488)", borderRadius: 16, padding: 24, textAlign: "center", boxShadow: "0 8px 24px rgba(13,148,136,0.25)" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 1 }}>
              Sedang Dipanggil
            </p>
            
            <div style={{ fontSize: 54, fontWeight: 900, color: "#fff", letterSpacing: -2, margin: "4px 0" }}>
              {currentPatient.no}
            </div>

            <p style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: "4px 0 2px" }}>
              {currentPatient.name}
            </p>

            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", margin: 0, fontWeight: 600 }}>
              Poli {currentPatient.poli} — {currentPatient.doctorName || "dr. Maya Lestari"}
            </p>

            {/* Calling Control Buttons */}
            <div style={{ marginTop: 20, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              <button 
                onClick={() => speakCall(currentPatient.no, currentPatient.name, currentPatient.poli)}
                style={{ padding: "9px 16px", borderRadius: 10, background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", gap: 6 }}>
                <Volume2 style={{ width: 15, height: 15 }} /> Panggil Ulang
              </button>

              <button 
                onClick={() => handleCompleteCurrent()} 
                style={{ padding: "9px 16px", borderRadius: 10, background: "#fff", border: "none", color: "#0d9488", fontSize: 12, fontWeight: 800, cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", gap: 6 }}>
                <Check style={{ width: 15, height: 15 }} /> Check-In ✓
              </button>
            </div>
          </div>

          {/* AI Optimization Alert */}
          <div style={{ background: "linear-gradient(135deg, #667eea, #764ba2)", borderRadius: 16, padding: 16, color: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <TrendingUp style={{ width: 16, height: 16, color: "#fff" }} />
              <span style={{ fontSize: 13, fontWeight: 700 }}>Saran AI — Estimasi Antrean</span>
            </div>
            <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.85)", lineHeight: 1.6, margin: 0 }}>
              Waktu tunggu rata-rata antrean saat ini <strong style={{ color: "#fff" }}>12 menit</strong>. Beban antrean Poli Umum paling tinggi.
            </p>
          </div>

          {/* Poli Summary Breakdown */}
          <Container style={{ padding: 18 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: "0 0 14px" }}>Antrean Menunggu per Poli</h3>
            {Object.keys(POLI_CONFIG).map((pName) => {
              const cfg = POLI_CONFIG[pName];
              const count = queueList.filter(q => q.poli === pName && q.status === "menunggu").length;
              return (
                <div key={pName} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>Poli {pName}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: cfg.color }}>{count} Pasien</span>
                  </div>
                  <div style={{ height: 6, background: "#f1f5f9", borderRadius: 10, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(100, (count / 10) * 100)}%`, background: cfg.color, borderRadius: 10, transition: "width 0.3s" }} />
                  </div>
                </div>
              );
            })}
          </Container>
        </div>

        {/* Queue Table Panel */}
        <Container style={{ overflow: "hidden" }}>
          {/* Table Toolbar */}
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 200 }}>
              <div style={{ position: "relative", width: "100%", maxWidth: 280 }}>
                <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#94a3b8" }} />
                <input 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  placeholder="Cari no. antrean atau pasien..."
                  style={{ width: "100%", paddingLeft: 32, paddingRight: 12, paddingTop: 7, paddingBottom: 7, borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#f8fafc", fontSize: 12, outline: "none" }} 
                />
              </div>

              <select 
                value={selPoliFilter}
                onChange={e => setSelPoliFilter(e.target.value)}
                style={{ padding: "7px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 12, fontWeight: 600, color: "#475569", outline: "none", cursor: "pointer" }}>
                <option value="Semua">Semua Poli</option>
                {Object.keys(POLI_CONFIG).map(p => <option key={p} value={p}>Poli {p}</option>)}
              </select>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: "flex", gap: 4 }}>
              {["Semua", "Menunggu", "Dipanggil", "Selesai"].map(f => (
                <button 
                  key={f} 
                  onClick={() => setSelFilter(f)}
                  style={{ 
                    padding: "5px 12px", borderRadius: 8, border: "1.5px solid", fontSize: 11.5, fontWeight: 600, cursor: "pointer",
                    borderColor: selFilter === f ? "#0d9488" : "#e2e8f0",
                    background: selFilter === f ? "#0d9488" : "#fff",
                    color: selFilter === f ? "#fff" : "#64748b"
                  }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["No. Antrean", "Pasien", "Poli", "Status", "Jam Dibuat", "Aksi"].map(h => (
                    <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#64748b", borderBottom: "1px solid #e8f0fe" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredQueue.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: 36, color: "#94a3b8", fontSize: 13 }}>
                      Tidak ada data antrean yang cocok.
                    </td>
                  </tr>
                ) : (
                  filteredQueue.map((q) => (
                    <tr key={q.id} style={{ borderBottom: "1px solid #f8fafc", transition: "background 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#f0f9ff")}
                      onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
                      
                      {/* Ticket No */}
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontSize: 16, fontWeight: 900, color: q.color || "#0d9488" }}>{q.no}</span>
                      </td>

                      {/* Patient Name */}
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 30, height: 30, borderRadius: "50%", background: q.color || "#0d9488", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                            {q.avatar || q.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 13 }}>{q.name}</div>
                            <div style={{ fontSize: 10.5, color: "#64748b" }}>{q.patientId || "RM-"}</div>
                          </div>
                        </div>
                      </td>

                      {/* Poli */}
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ background: POLI_CONFIG[q.poli]?.bg || "#e0f2fe", color: POLI_CONFIG[q.poli]?.color || "#0d9488", borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
                          Poli {q.poli}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "12px 16px" }}>
                        {statusBadge(q.status)}
                      </td>

                      {/* Time */}
                      <td style={{ padding: "12px 16px", color: "#64748b", fontWeight: 600, fontSize: 12 }}>
                        {q.createdTime || "09:00"}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          {q.status === "menunggu" && (
                            <button 
                              onClick={() => handleCallSpecific(q)}
                              style={{ padding: "5px 12px", borderRadius: 8, border: "none", background: "#0d9488", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                              Panggil
                            </button>
                          )}

                          {q.status === "dipanggil" && (
                            <button 
                              onClick={() => handleCompleteCurrent(q.no)}
                              style={{ padding: "5px 12px", borderRadius: 8, border: "none", background: "#16a34a", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                              Check-In ✓
                            </button>
                          )}

                          <button 
                            onClick={() => setShowPrintTicket(q)}
                            title="Cetak Tiket"
                            style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                            <Printer style={{ width: 13, height: 13 }} />
                          </button>

                          {q.status !== "dibatalkan" && (
                            <button 
                              onClick={() => handleCancelQueue(q.id)}
                              title="Batalkan Antrean"
                              style={{ padding: "5px 8px", borderRadius: 8, border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                              ✕
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
      </div>

      {/* AMBIL TIKET / TAMBAH ANTREAN MODAL */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <Container style={{ width: 480, padding: 26, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>Ambil Tiket Antrean Baru</h2>
                <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>Cetak tiket antrean loket pendaftaran atau poli</p>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ border: "none", background: "#f1f5f9", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13, color: "#64748b", fontWeight: 700 }}>✕</button>
            </div>

            <form onSubmit={handleCreateTicketSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Registered Patient Select */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>
                  Pilih Pasien Terdaftar (Opsional)
                </label>
                <select 
                  onChange={e => handleSelectRegisteredPatient(e.target.value)}
                  style={{ width: "100%", padding: "9.5px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8fafc", fontSize: 13, color: "#1e293b", outline: "none" }}>
                  <option value="">-- Pasien Baru / Walk-in --</option>
                  {registeredPatients.map(p => (
                    <option key={p.rm} value={p.rm}>{p.name} ({p.rm})</option>
                  ))}
                </select>
              </div>

              {/* Patient Name */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>
                  Nama Lengkap Pasien <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input 
                  type="text" 
                  required
                  value={newTicketData.name}
                  onChange={e => setNewTicketData({ ...newTicketData, name: e.target.value })}
                  placeholder="Ketik nama pasien..."
                  style={{ width: "100%", padding: "9.5px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13, color: "#1e293b", outline: "none" }} 
                />
              </div>

              {/* Phone */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>
                  Nomor HP / Whatsapp
                </label>
                <input 
                  type="text" 
                  value={newTicketData.phone}
                  onChange={e => setNewTicketData({ ...newTicketData, phone: e.target.value })}
                  placeholder="0812-xxxx-xxxx"
                  style={{ width: "100%", padding: "9.5px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13, color: "#1e293b", outline: "none" }} 
                />
              </div>

              {/* Poli Select */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>
                  Poli / Klinik Tujuan <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select 
                  value={newTicketData.poli}
                  onChange={e => setNewTicketData({ ...newTicketData, poli: e.target.value })}
                  style={{ width: "100%", padding: "9.5px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13, color: "#1e293b", outline: "none" }}>
                  {Object.keys(POLI_CONFIG).map(p => (
                    <option key={p} value={p}>Poli {p} ({POLI_CONFIG[p].doctor})</option>
                  ))}
                </select>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowAddModal(false)} 
                  style={{ flex: 1, padding: "10.5px 0", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 700, color: "#64748b", cursor: "pointer" }}>
                  Batal
                </button>
                <button type="submit" 
                  style={{ flex: 2, padding: "10.5px 0", borderRadius: 10, border: "none", background: "#0d9488", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", boxShadow: "0 4px 12px rgba(13,148,136,0.3)" }}>
                  Buat & Cetak Tiket
                </button>
              </div>
            </form>
          </Container>
        </div>
      )}

      {/* PRINT TICKET PREVIEW MODAL */}
      {showPrintTicket && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <Container style={{ width: 360, padding: 24, textAlign: "center", background: "#fff" }}>
            {/* Header Ticket */}
            <div style={{ borderBottom: "2px stroke #0f172a", paddingBottom: 12, marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 900, color: "#0f172a", margin: 0 }}>Klinik Sehat Sentosa</h3>
              <p style={{ fontSize: 10, color: "#64748b", margin: "2px 0 0" }}>Cabang Semarang • Telepon: (024) 8899-77</p>
            </div>

            <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", margin: "0 0 4px" }}>
              TIKET ANTREAN PASIEN
            </p>

            {/* Queue Code Display */}
            <div style={{ fontSize: 52, fontWeight: 900, color: showPrintTicket.color || "#0d9488", letterSpacing: -2, margin: "8px 0" }}>
              {showPrintTicket.no}
            </div>

            <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12, marginBottom: 16, textAlign: "left", fontSize: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: "#64748b", fontWeight: 600 }}>Nama Pasien:</span>
                <strong style={{ color: "#0f172a" }}>{showPrintTicket.name}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: "#64748b", fontWeight: 600 }}>Poli Tujuan:</span>
                <strong style={{ color: "#0d9488" }}>Poli {showPrintTicket.poli}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b", fontWeight: 600 }}>Waktu Cetak:</span>
                <span style={{ color: "#0f172a" }}>{showPrintTicket.date || getTodayStr()} ({showPrintTicket.createdTime || "09:00"})</span>
              </div>
            </div>

            {/* Barcode Mockup */}
            <div style={{ background: "#0f172a", color: "#fff", height: 36, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontFamily: "monospace", letterSpacing: 4, marginBottom: 14 }}>
              ||||| | |||| |||| |||
            </div>

            <p style={{ fontSize: 10, color: "#94a3b8", margin: "0 0 18px", fontStyle: "italic" }}>
              Harap memperhatikan layar panggil. Terima kasih.
            </p>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 10 }}>
              <button 
                onClick={() => setShowPrintTicket(null)}
                style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                Tutup
              </button>
              <button 
                onClick={() => {
                  window.print();
                  setShowPrintTicket(null);
                }}
                style={{ flex: 2, padding: "9px 0", borderRadius: 10, border: "none", background: "#0d9488", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Printer style={{ width: 14, height: 14 }} /> Cetak Tiket
              </button>
            </div>
          </Container>
        </div>
      )}
    </div>
  );
}
