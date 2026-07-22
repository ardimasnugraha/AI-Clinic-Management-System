"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, Calendar as CalendarIcon, Clock, Wallet, ChevronLeft, ChevronRight, 
  Sparkles, ShieldCheck, ArrowRight, Eye, CheckCircle2, Shield, Lock, Activity, FileText,
  X, User, Stethoscope
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { getStoredDoctors, Doctor as StoreDoctor } from "@/lib/store";

interface DashboardViewProps {
  onNavigateTab?: (tabName: string) => void;
}

export default function DashboardView({ onNavigateTab }: DashboardViewProps) {
  const [activeChartTab, setActiveChartTab] = useState<"kunjungan" | "pendapatan">("kunjungan");
  const [timeFilter, setTimeFilter] = useState<"Hari Ini" | "Minggu Ini" | "Bulan Ini">("Hari Ini");
  const [chartRangeFilter, setChartRangeFilter] = useState<"7 Hari" | "30 Hari">("7 Hari");
  
  // Selected Calendar Day
  const [selectedDay, setSelectedDay] = useState<number>(20);

  // Modal States
  const [selectedDoctorModal, setSelectedDoctorModal] = useState<any | null>(null);
  const [showAllDoctorsModal, setShowAllDoctorsModal] = useState<boolean>(false);
  const [activeAiModal, setActiveAiModal] = useState<{ title: string; desc: string; detail: string } | null>(null);

  // Real-time Supabase & Store Data States
  const [patientCount, setPatientCount] = useState<number>(0);
  const [todayApptCount, setTodayApptCount] = useState<number>(0);
  const [activeQueueCount, setActiveQueueCount] = useState<number>(0);
  const [todayRevenue, setTodayRevenue] = useState<number>(0);

  const [appointmentsList, setAppointmentsList] = useState<Array<{ time: string; name: string; type: string; status: string }>>([]);
  const [allApptsData, setAllApptsData] = useState<any[]>([]);

  const [liveQueue, setLiveQueue] = useState<Array<{ no: string; name: string; service: string; time: string; status: string }>>([]);

  const [doctorsList, setDoctorsList] = useState<Array<{ name: string; poli: string; time: string; count: number; initials: string; bg: string; color: string; sip?: string; phone?: string }>>([]);

  const [encounterStats, setEncounterStats] = useState({ total: 0, selesai: 0, dirujuk: 0, followUp: 0 });
  const [auditTime, setAuditTime] = useState("10:24");

  // Fetch Supabase Data dynamically
  useEffect(() => {
    async function loadSupabaseData() {
      try {
        // 1. Fetch Pasien dari Supabase
        const { count: countP, data: pData } = await supabase.from("patients").select("*", { count: "exact" });
        if (countP !== null) {
          setPatientCount(countP);
        } else {
          const localP = localStorage.getItem("clinic_patients_v1");
          if (localP) setPatientCount(JSON.parse(localP).length);
        }

        // 2. Fetch Appointments dari Supabase
        const { count: countA, data: apptsData } = await supabase.from("appointments").select("*", { count: "exact" });
        if (countA !== null) {
          setTodayApptCount(countA);
          if (apptsData) {
            setAllApptsData(apptsData);
            const mappedAppts = apptsData.slice(0, 5).map((a: any) => ({
              time: a.duration ? a.duration.split(" - ")[0] : "08:30",
              name: a.doctor_name || "Pasien",
              type: a.poli || "Konsultasi Umum",
              status: a.status === "menunggu" ? "Menunggu" : a.status === "selesai" ? "Selesai" : "Terjadwal"
            }));
            setAppointmentsList(mappedAppts);
          }
        } else {
          const localA = localStorage.getItem("clinic_appointments_v1");
          if (localA) {
            const parsedA = JSON.parse(localA);
            setTodayApptCount(parsedA.length);
            setAppointmentsList(parsedA.slice(0, 5).map((a: any) => ({
              time: a.time || "08:30",
              name: a.patientName || a.name || "Pasien",
              type: a.poli || "Konsultasi",
              status: a.status || "Terjadwal"
            })));
          }
        }

        // 3. Fetch Queues & Pendapatan
        const { data: qData } = await supabase.from("queues").select("*").eq("status", "menunggu");
        if (qData) {
          setActiveQueueCount(qData.length);
          setLiveQueue(qData.map((q: any) => ({
            no: q.ticket_no,
            name: q.patient_name,
            service: q.poli,
            time: q.created_time || "09:00",
            status: q.status
          })));
        }

        const { data: invData } = await supabase.from("invoices").select("total").eq("status", "Lunas");
        if (invData) {
          const rev = invData.reduce((acc: number, curr: any) => acc + Number(curr.total || 0), 0);
          setTodayRevenue(rev);
        }

        // 4. Fetch Doctors dari doctor_profiles Supabase
        const { data: docProfiles } = await supabase.from("doctor_profiles").select("*");
        if (docProfiles && docProfiles.length > 0) {
          const mappedDocs = docProfiles.map((d: any) => ({
            name: d.full_name,
            poli: `Dokter ${d.poli}`,
            time: "08:00 - 16:00",
            count: 0,
            initials: d.full_name.split(" ").map((w: string) => w[0]).slice(0, 2).join(""),
            bg: d.color ? `${d.color}22` : "#e0f2fe",
            color: d.color || "#0d9488",
            sip: d.sip || "SIP-2026-001",
            phone: d.phone || "0812-0000-0000"
          }));
          setDoctorsList(mappedDocs);
        } else {
          const storeDocs = getStoredDoctors();
          if (storeDocs && storeDocs.length > 0) {
            setDoctorsList(storeDocs.map(d => ({
              name: d.name,
              poli: `Dokter ${d.poli}`,
              time: "08:00 - 16:00",
              count: 0,
              initials: d.name.split(" ").map(w => w[0]).slice(0, 2).join(""),
              bg: d.bg || "#e0f2fe",
              color: d.color || "#0d9488",
              sip: d.sip,
              phone: d.phone
            })));
          } else {
            setDoctorsList([]);
          }
        }

        // 5. Fetch Encounters dari Supabase
        const { count: countE, data: eData } = await supabase.from("encounters").select("*", { count: "exact" });
        if (countE !== null) {
          const finished = eData ? eData.filter((e: any) => e.status === "completed" || e.status === "selesai").length : 0;
          setEncounterStats({
            total: countE,
            selesai: finished,
            dirujuk: 0,
            followUp: Math.max(0, countE - finished)
          });
        }

        // 6. Fetch Audit Log Waktu Terakhir dari Supabase
        const { data: logData } = await supabase.from("audit_logs").select("created_at").order("created_at", { ascending: false }).limit(1);
        if (logData && logData.length > 0) {
          const t = new Date(logData[0].created_at);
          setAuditTime(`${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`);
        }

      } catch (err) {
        console.warn("Error fetching Supabase dashboard data:", err);
      }
    }

    loadSupabaseData();
  }, [timeFilter]);

  // Handler when clicking a day on calendar
  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
    if (allApptsData.length > 0) {
      const filtered = allApptsData.filter((a: any) => {
        if (!a.scheduled_time) return true;
        const d = new Date(a.scheduled_time);
        return d.getDate() === day;
      });
      if (filtered.length > 0) {
        setAppointmentsList(filtered.map((a: any) => ({
          time: a.duration ? a.duration.split(" - ")[0] : "08:30",
          name: a.doctor_name || "Pasien",
          type: a.poli || "Konsultasi Umum",
          status: a.status === "menunggu" ? "Menunggu" : a.status === "selesai" ? "Selesai" : "Terjadwal"
        })));
        return;
      }
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: "Inter, system-ui, sans-serif" }}>
      
      {/* ================= MODAL DETAIL DOKTER ================= */}
      {(selectedDoctorModal || showAllDoctorsModal) && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: showAllDoctorsModal ? 640 : 420, padding: 24, boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                {showAllDoctorsModal ? "Daftar Lengkap Dokter Praktik Klinik" : "Detail Praktik Dokter"}
              </h3>
              <button onClick={() => { setSelectedDoctorModal(null); setShowAllDoctorsModal(false); }} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 18, color: "#64748b" }}>✕</button>
            </div>

            {showAllDoctorsModal ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 400, overflowY: "auto" }}>
                {doctorsList.map((doc, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", padding: 14, borderRadius: 14, border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 42, height: 42, borderRadius: "50%", background: doc.bg, color: doc.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 }}>
                        {doc.initials}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>{doc.name}</div>
                        <div style={{ fontSize: 11, color: doc.color, fontWeight: 700 }}>{doc.poli}</div>
                        <div style={{ fontSize: 10.5, color: "#64748b" }}>{doc.sip || "SIP-2026-001"} • {doc.phone || "0812-1111-2222"}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ background: "#dcfce7", color: "#166534", padding: "3px 10px", borderRadius: 12, fontSize: 10.5, fontWeight: 800 }}>Aktif</span>
                      <div style={{ fontSize: 11, color: "#0f172a", fontWeight: 700, marginTop: 4 }}>{doc.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : selectedDoctorModal && (
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: selectedDoctorModal.bg, color: selectedDoctorModal.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 20, margin: "0 auto 12px" }}>
                  {selectedDoctorModal.initials}
                </div>
                <h4 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0 }}>{selectedDoctorModal.name}</h4>
                <p style={{ fontSize: 12, color: selectedDoctorModal.color, fontWeight: 700, margin: "2px 0 12px" }}>{selectedDoctorModal.poli}</p>
                <span style={{ background: "#dcfce7", color: "#166534", padding: "3px 12px", borderRadius: 12, fontSize: 11, fontWeight: 800 }}>Status: Praktik Aktif</span>

                <div style={{ background: "#f8fafc", padding: 14, borderRadius: 14, border: "1px solid #e2e8f0", fontSize: 12, color: "#475569", textAlign: "left", marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div><strong>No. SIP:</strong> {selectedDoctorModal.sip || "SIP-2026-001"}</div>
                  <div><strong>No. HP / Telepon:</strong> {selectedDoctorModal.phone || "0812-1111-2222"}</div>
                  <div><strong>Jadwal Praktik:</strong> {selectedDoctorModal.time}</div>
                  <div><strong>Kuota Pasien Hari Ini:</strong> {selectedDoctorModal.count} Pasien</div>
                </div>
              </div>
            )}

            <button 
              onClick={() => { setSelectedDoctorModal(null); setShowAllDoctorsModal(false); }}
              style={{ width: "100%", marginTop: 20, padding: 11, borderRadius: 12, border: "none", background: "#0d9488", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL AI ASSISTANT DETAIL ================= */}
      {activeAiModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 440, padding: 24, boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles style={{ width: 20, height: 20, color: "#8b5cf6" }} />
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "#581c87", margin: 0 }}>{activeAiModal.title}</h3>
              </div>
              <button onClick={() => setActiveAiModal(null)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 18, color: "#64748b" }}>✕</button>
            </div>

            <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.5, marginBottom: 14 }}>{activeAiModal.desc}</p>

            <div style={{ background: "#faf5ff", border: "1px solid #e9d5ff", padding: 14, borderRadius: 14, fontSize: 12, color: "#6b21a8", lineHeight: 1.6 }}>
              {activeAiModal.detail}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => { setActiveAiModal(null); onNavigateTab?.("AI Assistant"); }}
                style={{ flex: 1, padding: 10, borderRadius: 10, border: "none", background: "#8b5cf6", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                Buka AI Clinical Assistant
              </button>
              <button onClick={() => setActiveAiModal(null)}
                style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TOP 4 STATS CARDS WITH SPARKLINE WAVES ================= */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        
        {/* Card 1: Pasien Hari Ini */}
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #fce8e6", padding: "18px 20px", position: "relative", overflow: "hidden", boxShadow: "0 4px 16px rgba(255,90,80,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, #ff7b72, #ff5a50)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(255,90,80,0.3)" }}>
              <Users style={{ width: 22, height: 22, color: "#fff" }} />
            </div>
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>Pasien {timeFilter}</span>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", lineHeight: 1.1 }}>{patientCount}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: 11, fontWeight: 700, color: "#16a34a" }}>
            <span>↑ 18%</span>
            <span style={{ color: "#94a3b8", fontWeight: 500 }}>dari kemarin</span>
          </div>
          {/* Sparkline Wave Red */}
          <div style={{ marginTop: 6, height: 26, width: "100%" }}>
            <svg width="100%" height="26" viewBox="0 0 200 30" preserveAspectRatio="none">
              <path d="M0 25 Q30 5, 60 20 T120 10 T180 22 T200 5 L200 30 L0 30 Z" fill="url(#gradRed)" opacity="0.15" />
              <path d="M0 25 Q30 5, 60 20 T120 10 T180 22 T200 5" fill="none" stroke="#ff5a50" strokeWidth="2.5" strokeLinecap="round" />
              <defs>
                <linearGradient id="gradRed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff5a50" />
                  <stop offset="100%" stopColor="#ffffff" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Card 2: Appointment Hari Ini */}
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #e0f2fe", padding: "18px 20px", position: "relative", overflow: "hidden", boxShadow: "0 4px 16px rgba(6,182,212,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, #06b6d4, #0891b2)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(6,182,212,0.3)" }}>
              <CalendarIcon style={{ width: 22, height: 22, color: "#fff" }} />
            </div>
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>Appointment {timeFilter}</span>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", lineHeight: 1.1 }}>{todayApptCount}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: 11, fontWeight: 700, color: "#16a34a" }}>
            <span>↑ 9%</span>
            <span style={{ color: "#94a3b8", fontWeight: 500 }}>dari kemarin</span>
          </div>
          {/* Sparkline Wave Cyan */}
          <div style={{ marginTop: 6, height: 26, width: "100%" }}>
            <svg width="100%" height="26" viewBox="0 0 200 30" preserveAspectRatio="none">
              <path d="M0 20 Q40 28, 80 12 T140 22 T200 8 L200 30 L0 30 Z" fill="url(#gradCyan)" opacity="0.15" />
              <path d="M0 20 Q40 28, 80 12 T140 22 T200 8" fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" />
              <defs>
                <linearGradient id="gradCyan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#ffffff" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Card 3: Antrian Aktif */}
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #f3e8ff", padding: "18px 20px", position: "relative", overflow: "hidden", boxShadow: "0 4px 16px rgba(139,92,246,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, #a855f7, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(139,92,246,0.3)" }}>
              <Clock style={{ width: 22, height: 22, color: "#fff" }} />
            </div>
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>Antrian Aktif</span>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", lineHeight: 1.1 }}>{activeQueueCount}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: 11, fontWeight: 700, color: "#8b5cf6" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#8b5cf6" }} />
            <span>Sedang dilayani</span>
          </div>
          {/* Sparkline Wave Purple */}
          <div style={{ marginTop: 6, height: 26, width: "100%" }}>
            <svg width="100%" height="26" viewBox="0 0 200 30" preserveAspectRatio="none">
              <path d="M0 28 Q35 10, 70 25 T140 8 T200 18 L200 30 L0 30 Z" fill="url(#gradPurple)" opacity="0.15" />
              <path d="M0 28 Q35 10, 70 25 T140 8 T200 18" fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" />
              <defs>
                <linearGradient id="gradPurple" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#ffffff" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Card 4: Pendapatan Hari Ini */}
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #fef3c7", padding: "18px 20px", position: "relative", overflow: "hidden", boxShadow: "0 4px 16px rgba(245,158,11,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, #fbbf24, #f59e0b)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(245,158,11,0.3)" }}>
              <Wallet style={{ width: 22, height: 22, color: "#fff" }} />
            </div>
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>Pendapatan {timeFilter}</span>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", lineHeight: 1.1 }}>Rp {(todayRevenue * (timeFilter === "Hari Ini" ? 1 : timeFilter === "Minggu Ini" ? 4.5 : 18)).toLocaleString("id-ID")}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: 11, fontWeight: 700, color: "#16a34a" }}>
            <span>↑ 22%</span>
            <span style={{ color: "#94a3b8", fontWeight: 500 }}>dari kemarin</span>
          </div>
          {/* Sparkline Wave Orange */}
          <div style={{ marginTop: 6, height: 26, width: "100%" }}>
            <svg width="100%" height="26" viewBox="0 0 200 30" preserveAspectRatio="none">
              <path d="M0 22 Q40 5, 80 18 T150 10 T200 24 L200 30 L0 30 Z" fill="url(#gradOrange)" opacity="0.15" />
              <path d="M0 22 Q40 5, 80 18 T150 10 T200 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
              <defs>
                <linearGradient id="gradOrange" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ffffff" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

      </div>

      {/* ================= ROW 2: KALENDER & APPOINTMENT | STATUS ANTREAN | JADWAL DOKTER ================= */}
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1.2fr 1fr", gap: 16 }}>
        
        {/* Widget 1: Kalender & Appointment */}
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #f1f5f9", padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>Kalender & Appointment</h3>
            <select 
              value={timeFilter}
              onChange={e => setTimeFilter(e.target.value as any)}
              style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: "#475569", cursor: "pointer", outline: "none" }}>
              <option value="Hari Ini">Hari Ini</option>
              <option value="Minggu Ini">Minggu Ini</option>
              <option value="Bulan Ini">Bulan Ini</option>
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 16, alignItems: "start" }}>
            {/* Left Mini Calendar */}
            <div style={{ background: "#fafafa", borderRadius: 14, padding: 12, border: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#0f172a" }}>{selectedDay} Mei 2025</span>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => handleSelectDay(Math.max(1, selectedDay - 1))} style={{ border: "none", background: "none", cursor: "pointer", padding: 2 }}><ChevronLeft style={{ width: 14, height: 14, color: "#64748b" }} /></button>
                  <button onClick={() => handleSelectDay(Math.min(31, selectedDay + 1))} style={{ border: "none", background: "none", cursor: "pointer", padding: 2 }}><ChevronRight style={{ width: 14, height: 14, color: "#64748b" }} /></button>
                </div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textAlign: "center", marginBottom: 8 }}>Mei 2025</div>
              
              {/* Day Headers */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", fontSize: 9.5, fontWeight: 700, color: "#94a3b8", marginBottom: 6 }}>
                <span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span><span>Min</span>
              </div>
              
              {/* Calendar Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", fontSize: 10.5, fontWeight: 600, color: "#334155", gap: "4px 0" }}>
                <span style={{ color: "#cbd5e1" }}>28</span><span style={{ color: "#cbd5e1" }}>29</span><span style={{ color: "#cbd5e1" }}>30</span>
                {[...Array(31)].map((_, i) => {
                  const d = i + 1;
                  const isSel = d === selectedDay;
                  return (
                    <span 
                      key={d} 
                      onClick={() => handleSelectDay(d)}
                      style={{ 
                        cursor: "pointer",
                        background: isSel ? "#0d9488" : "transparent",
                        color: isSel ? "#fff" : "#334155",
                        borderRadius: "50%", width: 22, height: 22,
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        fontWeight: isSel ? 800 : 600, margin: "0 auto"
                      }}>
                      {d}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Right Appointment List Slots */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {appointmentsList.map((item, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", padding: "8px 12px", borderRadius: 12, border: "1px solid #f1f5f9" }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#0d9488" }}>{item.time}</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a" }}>{item.name}</div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>{item.type}</div>
                  </div>
                  <span style={{ 
                    background: item.status === "Selesai" ? "#dcfce7" : item.status === "Berjalan" ? "#ede9fe" : item.status === "Menunggu" ? "#fff7ed" : "#e0f2fe", 
                    color: item.status === "Selesai" ? "#15803d" : item.status === "Berjalan" ? "#6d28d9" : item.status === "Menunggu" ? "#c2410c" : "#0369a1", 
                    padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 800 
                  }}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 12, textAlign: "center" }}>
            <button 
              onClick={() => onNavigateTab?.("Appointment")}
              style={{ border: "none", background: "none", fontSize: 11.5, fontWeight: 700, color: "#0d9488", cursor: "pointer" }}>
              Lihat semua appointment →
            </button>
          </div>
        </div>

        {/* Widget 2: Status Antrian */}
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #f1f5f9", padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>Status Antrian</h3>
            <button 
              onClick={() => onNavigateTab?.("Antrean")}
              style={{ border: "none", background: "none", fontSize: 11.5, fontWeight: 700, color: "#0d9488", cursor: "pointer" }}>
              Lihat Semua →
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ color: "#94a3b8", fontWeight: 700, borderBottom: "1px solid #f1f5f9" }}>
                  <th style={{ padding: "6px 4px" }}>No. Antrian</th>
                  <th style={{ padding: "6px 4px" }}>Pasien</th>
                  <th style={{ padding: "6px 4px" }}>Layanan</th>
                  <th style={{ padding: "6px 4px" }}>Waktu</th>
                  <th style={{ padding: "6px 4px" }}>Status</th>
                </tr>
              </thead>
              <tbody style={{ fontWeight: 600, color: "#334155" }}>
                {liveQueue.map((q, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <td style={{ padding: "8px 4px", fontWeight: 800, color: idx === 0 ? "#0d9488" : idx === 1 ? "#f59e0b" : "#8b5cf6" }}>{q.no}</td>
                    <td style={{ padding: "8px 4px", fontWeight: 750, color: "#0f172a" }}>{q.name}</td>
                    <td style={{ padding: "8px 4px" }}>{q.service}</td>
                    <td style={{ padding: "8px 4px", color: "#64748b" }}>{q.time}</td>
                    <td style={{ padding: "8px 4px" }}>
                      <span style={{ 
                        background: q.status === "Sedang Dilayani" ? "#dcfce7" : q.status === "Dipanggil" ? "#dbeafe" : "#fff7ed", 
                        color: q.status === "Sedang Dilayani" ? "#15803d" : q.status === "Dipanggil" ? "#1d4ed8" : "#c2410c", 
                        padding: "2px 8px", borderRadius: 12, fontSize: 9.5, fontWeight: 800 
                      }}>
                        {q.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Widget 3: Jadwal Dokter */}
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #f1f5f9", padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>Jadwal Dokter</h3>
            <button 
              onClick={() => setShowAllDoctorsModal(true)}
              style={{ border: "none", background: "none", fontSize: 11.5, fontWeight: 700, color: "#0d9488", cursor: "pointer" }}>
              Lihat Semua →
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {doctorsList.slice(0, 4).map((doc, idx) => (
              <div 
                key={idx} 
                onClick={() => setSelectedDoctorModal(doc)}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fafafa", padding: 10, borderRadius: 14, cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
                onMouseLeave={e => e.currentTarget.style.background = "#fafafa"}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: doc.bg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: doc.color, fontSize: 12 }}>
                    {doc.initials}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a" }}>{doc.name}</div>
                    <div style={{ fontSize: 10.5, color: "#64748b" }}>{doc.poli}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ background: idx === 0 ? "#dcfce7" : idx === 1 ? "#fff7ed" : idx === 2 ? "#f3e8ff" : "#dbeafe", color: idx === 0 ? "#166534" : idx === 1 ? "#c2410c" : idx === 2 ? "#6b21a8" : "#1d4ed8", padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 800, display: "inline-block" }}>{doc.time}</span>
                  <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>👥 {doc.count} pasien</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ================= ROW 3: RINGKASAN ENCOUNTER | AI CLINICAL ASSISTANT | GRAFIK KUNJUNGAN & PENDAPATAN ================= */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr 1.3fr", gap: 16 }}>
        
        {/* Widget 1: Ringkasan Encounter (Donut Chart) */}
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #f1f5f9", padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>Ringkasan Encounter</h3>
            <button style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: "#475569", cursor: "pointer" }}>
              {timeFilter} ▾
            </button>
          </div>

          {/* Stats Badge Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 16, textAlign: "center" }}>
            <div style={{ background: "#ede9fe", padding: 8, borderRadius: 10 }}>
              <div style={{ fontSize: 9.5, color: "#6d28d9", fontWeight: 700 }}>Total Encounter</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: "#6d28d9" }}>{encounterStats.total}</div>
            </div>
            <div style={{ background: "#dcfce7", padding: 8, borderRadius: 10 }}>
              <div style={{ fontSize: 9.5, color: "#15803d", fontWeight: 700 }}>Selesai</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: "#15803d" }}>{encounterStats.selesai}</div>
            </div>
            <div style={{ background: "#fff7ed", padding: 8, borderRadius: 10 }}>
              <div style={{ fontSize: 9.5, color: "#c2410c", fontWeight: 700 }}>Dirujuk</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: "#c2410c" }}>{encounterStats.dirujuk}</div>
            </div>
            <div style={{ background: "#e0f2fe", padding: 8, borderRadius: 10 }}>
              <div style={{ fontSize: 9.5, color: "#0369a1", fontWeight: 700 }}>Follow Up</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: "#0369a1" }}>{encounterStats.followUp}</div>
            </div>
          </div>

          {/* Top 5 Diagnosis Header & Donut Chart */}
          <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", marginBottom: 10 }}>Top 5 Diagnosis</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* SVG Donut Chart */}
            <div style={{ width: 110, height: 110, flexShrink: 0, position: "relative" }}>
              <svg width="110" height="110" viewBox="0 0 42 42">
                <circle cx="21" cy="21" r="15.91549430918954" fill="#fff" stroke="#f1f5f9" strokeWidth="6" />
                <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#0d9488" strokeWidth="6" strokeDasharray="27 73" strokeDashoffset="25" />
                <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#06b6d4" strokeWidth="6" strokeDasharray="18 82" strokeDashoffset="98" />
                <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#8b5cf6" strokeWidth="6" strokeDasharray="15 85" strokeDashoffset="80" />
                <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#ec4899" strokeWidth="6" strokeDasharray="12 88" strokeDashoffset="65" />
                <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#cbd5e1" strokeWidth="6" strokeDasharray="28 72" strokeDashoffset="53" />
              </svg>
            </div>

            {/* Legend */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 10.5, color: "#475569" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#0d9488" }} /> ISPA <strong style={{ color: "#0f172a" }}>32 (27%)</strong></div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#06b6d4" }} /> Hipertensi <strong style={{ color: "#0f172a" }}>21 (18%)</strong></div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#8b5cf6" }} /> Gastritis <strong style={{ color: "#0f172a" }}>18 (15%)</strong></div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ec4899" }} /> Diabetes <strong style={{ color: "#0f172a" }}>14 (12%)</strong></div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#cbd5e1" }} /> Lainnya <strong style={{ color: "#0f172a" }}>33 (28%)</strong></div>
            </div>
          </div>

          <div style={{ marginTop: 12, textAlign: "center" }}>
            <button 
              onClick={() => onNavigateTab?.("Encounter")}
              style={{ border: "none", background: "none", fontSize: 11.5, fontWeight: 700, color: "#0d9488", cursor: "pointer" }}>
              Lihat laporan lengkap →
            </button>
          </div>
        </div>

        {/* Widget 2: AI Clinical Assistant Beta */}
        <div style={{ background: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)", borderRadius: 20, border: "1px solid #e9d5ff", padding: 20, boxShadow: "0 2px 10px rgba(139,92,246,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Sparkles style={{ width: 18, height: 18, color: "#8b5cf6" }} />
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "#581c87", margin: 0 }}>AI Clinical Assistant</h3>
            <span style={{ background: "#c084fc", color: "#fff", padding: "2px 8px", borderRadius: 10, fontSize: 9.5, fontWeight: 800 }}>Beta</span>
          </div>

          <p style={{ fontSize: 11.5, color: "#6b21a8", lineHeight: 1.4, marginBottom: 14 }}>
            Halo dr. Maya, berikut ringkasan & rekomendasi untuk membantu praktik Anda hari ini.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Item 1 */}
            <div style={{ background: "#fff", padding: "10px 12px", borderRadius: 12, border: "1px solid #f3e8ff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: "#f3e8ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Sparkles style={{ width: 14, height: 14, color: "#9333ea" }} />
                </div>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: "#0f172a" }}>Peringatan Interaksi Obat</div>
                  <div style={{ fontSize: 10, color: "#64748b" }}>3 pasien berisiko interaksi obat</div>
                </div>
              </div>
              <button 
                onClick={() => setActiveAiModal({
                  title: "Peringatan Interaksi Obat",
                  desc: "AI mendeteksi 3 pasien dengan potensi interaksi obat yang perlu ditinjau kembali sebelum peresepan disahkan.",
                  detail: "1. Budi Santoso (Asam Mefenamat + Antasida)\n2. Siti Nurhaliza (Amlodipine + Simvastatin)\n3. Dewi Anggraini (Chloramphenicol + Dexamethasone)"
                })}
                style={{ border: "none", background: "none", color: "#8b5cf6", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                Lihat
              </button>
            </div>

            {/* Item 2 */}
            <div style={{ background: "#fff", padding: "10px 12px", borderRadius: 12, border: "1px solid #f3e8ff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Users style={{ width: 14, height: 14, color: "#0284c7" }} />
                </div>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: "#0f172a" }}>Pasien Perlu Follow Up</div>
                  <div style={{ fontSize: 10, color: "#64748b" }}>24 pasien perlu tindak lanjut</div>
                </div>
              </div>
              <button 
                onClick={() => setActiveAiModal({
                  title: "Pasien Perlu Follow Up",
                  desc: "Daftar pasien kronis (Hipertensi, Diabetes) yang belum melakukan re-evaluasi rutin dalam 30 hari terakhir.",
                  detail: "Rekomendasi AI: Jadwalkan ulang pemeriksaan gula darah dan tekanan darah rutin via WhatsApp reminder klinik."
                })}
                style={{ border: "none", background: "none", color: "#8b5cf6", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                Lihat
              </button>
            </div>

            {/* Item 3 */}
            <div style={{ background: "#fff", padding: "10px 12px", borderRadius: 12, border: "1px solid #f3e8ff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Activity style={{ width: 14, height: 14, color: "#d97706" }} />
                </div>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: "#0f172a" }}>Insight Mingguan</div>
                  <div style={{ fontSize: 10, color: "#64748b" }}>Kunjungan naik 18% dibanding minggu lalu</div>
                </div>
              </div>
              <button 
                onClick={() => setActiveAiModal({
                  title: "Insight Kinerja Klinik",
                  desc: "Analisis performa & trafik pasien klinik minggu ini.",
                  detail: "Tren Kunjungan: Poli Umum naik 22%, Poli Gigi naik 14%. Waktu tunggu rata-rata antrean pasien membaik dari 14 menit menjadi 9 menit."
                })}
                style={{ border: "none", background: "none", color: "#8b5cf6", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                Lihat
              </button>
            </div>
          </div>

          <div style={{ marginTop: 14, textAlign: "center" }}>
            <button 
              onClick={() => onNavigateTab?.("AI Assistant")}
              style={{ border: "none", background: "none", fontSize: 12, fontWeight: 800, color: "#7e22ce", cursor: "pointer" }}>
              Buka AI Assistant →
            </button>
          </div>
        </div>

        {/* Widget 3: Grafik Kunjungan & Pendapatan */}
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #f1f5f9", padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>Grafik Kunjungan & Pendapatan</h3>
            <select 
              value={chartRangeFilter}
              onChange={e => setChartRangeFilter(e.target.value as any)}
              style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: "#475569", cursor: "pointer", outline: "none" }}>
              <option value="7 Hari">7 Hari Terakhir</option>
              <option value="30 Hari">30 Hari Terakhir</option>
            </select>
          </div>

          {/* Toggle Button Tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <button 
              onClick={() => setActiveChartTab("kunjungan")}
              style={{ padding: "6px 14px", borderRadius: 10, border: "none", background: activeChartTab === "kunjungan" ? "#0d9488" : "#f1f5f9", color: activeChartTab === "kunjungan" ? "#fff" : "#64748b", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
              Kunjungan
            </button>
            <button 
              onClick={() => setActiveChartTab("pendapatan")}
              style={{ padding: "6px 14px", borderRadius: 10, border: "none", background: activeChartTab === "pendapatan" ? "#f59e0b" : "#f1f5f9", color: activeChartTab === "pendapatan" ? "#fff" : "#64748b", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
              Pendapatan
            </button>
          </div>

          {/* Combo Bar & Line Chart SVG */}
          <div style={{ position: "relative", height: 140, width: "100%", marginTop: 10 }}>
            {/* Axis Y values */}
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 20, display: "flex", flexDirection: "column", justifyContent: "space-between", fontSize: 9, color: "#94a3b8" }}>
              <span>{chartRangeFilter === "7 Hari" ? "200" : "800"}</span>
              <span>{chartRangeFilter === "7 Hari" ? "150" : "600"}</span>
              <span>{chartRangeFilter === "7 Hari" ? "50" : "200"}</span>
              <span>0</span>
            </div>

            <div style={{ position: "absolute", right: 0, top: 0, bottom: 20, display: "flex", flexDirection: "column", justifyContent: "space-between", fontSize: 9, color: "#94a3b8" }}>
              <span>{chartRangeFilter === "7 Hari" ? "30 jt" : "120 jt"}</span>
              <span>{chartRangeFilter === "7 Hari" ? "20 jt" : "80 jt"}</span>
              <span>{chartRangeFilter === "7 Hari" ? "10 jt" : "40 jt"}</span>
              <span>0</span>
            </div>

            {/* SVG Chart area */}
            <div style={{ marginLeft: 26, marginRight: 26, height: 120 }}>
              <svg width="100%" height="100%" viewBox="0 0 280 100" preserveAspectRatio="none">
                {/* Horizontal Grid lines */}
                <line x1="0" y1="10" x2="280" y2="10" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="40" x2="280" y2="40" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="70" x2="280" y2="70" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="98" x2="280" y2="98" stroke="#cbd5e1" strokeWidth="1" />

                {/* Bars (Kunjungan) */}
                <rect x="10" y="30" width="14" height="68" rx="4" fill="#2dd4bf" />
                <rect x="50" y="22" width="14" height="76" rx="4" fill="#2dd4bf" />
                <rect x="90" y="28" width="14" height="70" rx="4" fill="#2dd4bf" />
                <rect x="130" y="35" width="14" height="63" rx="4" fill="#2dd4bf" />
                <rect x="170" y="20" width="14" height="78" rx="4" fill="#2dd4bf" />
                <rect x="210" y="15" width="14" height="83" rx="4" fill="#2dd4bf" />
                <rect x="250" y="25" width="14" height="73" rx="4" fill="#2dd4bf" />

                {/* Line & Dots (Pendapatan) */}
                <polyline 
                  points="17,45 57,25 97,35 137,28 177,15 217,32 257,40" 
                  fill="none" 
                  stroke="#f59e0b" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                />
                <circle cx="17" cy="45" r="3.5" fill="#f59e0b" stroke="#fff" strokeWidth="1.5" />
                <circle cx="57" cy="25" r="3.5" fill="#f59e0b" stroke="#fff" strokeWidth="1.5" />
                <circle cx="97" cy="35" r="3.5" fill="#f59e0b" stroke="#fff" strokeWidth="1.5" />
                <circle cx="137" cy="28" r="3.5" fill="#f59e0b" stroke="#fff" strokeWidth="1.5" />
                <circle cx="177" cy="15" r="3.5" fill="#f59e0b" stroke="#fff" strokeWidth="1.5" />
                <circle cx="217" cy="32" r="3.5" fill="#f59e0b" stroke="#fff" strokeWidth="1.5" />
                <circle cx="257" cy="40" r="3.5" fill="#f59e0b" stroke="#fff" strokeWidth="1.5" />
              </svg>
            </div>

            {/* Axis X Days */}
            <div style={{ marginLeft: 26, marginRight: 26, display: "flex", justifyContent: "space-between", fontSize: 9.5, color: "#64748b", fontWeight: 700, marginTop: 4 }}>
              {chartRangeFilter === "7 Hari" ? (
                <><span>14 Mei</span><span>15 Mei</span><span>16 Mei</span><span>17 Mei</span><span>18 Mei</span><span>19 Mei</span><span>20 Mei</span></>
              ) : (
                <><span>Minggu 1</span><span>Minggu 2</span><span>Minggu 3</span><span>Minggu 4</span></>
              )}
            </div>
          </div>

          {/* Chart Legend */}
          <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 14, fontSize: 10.5, fontWeight: 700 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#0d9488" }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: "#2dd4bf" }} /> Kunjungan
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#d97706" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} /> Pendapatan
            </div>
          </div>
        </div>

      </div>

      {/* ================= ROW 4: BANNER KEAMANAN & KEPATUHAN (FOOTER) ================= */}
      <div style={{ background: "linear-gradient(135deg, #e6fffa 0%, #ccfbf1 100%)", borderRadius: 20, border: "1px solid #99f6e4", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, boxShadow: "0 2px 10px rgba(13,148,136,0.05)" }}>
        
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#0d9488", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 4px 12px rgba(13,148,136,0.3)", flexShrink: 0 }}>
            <Shield style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 900, color: "#0f172a", margin: 0 }}>Keamanan & Kepatuhan</h4>
            <p style={{ fontSize: 11, color: "#0d9488", fontWeight: 700, margin: 0 }}>Sistem terenkripsi & sesuai regulasi rekam medis elektronik (Supabase Connected)</p>
          </div>
        </div>

        {/* 4 Security Indicators */}
        <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
          
          {/* Indicator 1 */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#0d9488", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}>
              <Lock style={{ width: 16, height: 16 }} />
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: "#0f172a" }}>Backup Data</div>
              <div style={{ fontSize: 10, color: "#64748b" }}>Terakhir: 20 Mei 2025 02:00</div>
              <span style={{ fontSize: 9.5, fontWeight: 800, color: "#166534" }}>Status: ● Berhasil</span>
            </div>
          </div>

          {/* Indicator 2 */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#0d9488", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}>
              <Users style={{ width: 16, height: 16 }} />
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: "#0f172a" }}>Akses Sistem</div>
              <div style={{ fontSize: 10, color: "#64748b" }}>Aktif: Supabase Connected</div>
              <span style={{ fontSize: 9.5, fontWeight: 800, color: "#166534" }}>Status: ● Aman</span>
            </div>
          </div>

          {/* Indicator 3 */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#0d9488", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}>
              <FileText style={{ width: 16, height: 16 }} />
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: "#0f172a" }}>Audit Log</div>
              <div style={{ fontSize: 10, color: "#64748b" }}>Aktivitas terakhir: {auditTime}</div>
              <span style={{ fontSize: 9.5, fontWeight: 800, color: "#166534" }}>Status: ● Normal</span>
            </div>
          </div>

          {/* Indicator 4 */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#0d9488", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}>
              <CheckCircle2 style={{ width: 16, height: 16 }} />
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: "#0f172a" }}>Kepatuhan</div>
              <div style={{ fontSize: 10, color: "#64748b" }}>Permenkes No. 24/2022</div>
              <span style={{ fontSize: 9.5, fontWeight: 800, color: "#166534" }}>Status: ● Patuh</span>
            </div>
          </div>

        </div>

        <button 
          onClick={() => onNavigateTab?.("Audit Log")}
          style={{ background: "#0d9488", color: "#fff", border: "none", borderRadius: 12, padding: "8px 16px", fontSize: 11.5, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 2px 8px rgba(13,148,136,0.2)" }}>
          Lihat Detail Keamanan →
        </button>

      </div>

    </div>
  );
}
