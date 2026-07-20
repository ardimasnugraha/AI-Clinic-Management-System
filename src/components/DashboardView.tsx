"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, Calendar, Clock, TrendingUp, ChevronLeft, ChevronRight, 
  ShieldCheck, AlertTriangle, ArrowRight, UserCheck, Stethoscope, Eye,
  Shield, Laptop, FileText, CheckCircle2, ChevronDown, Wallet, Plus
} from "lucide-react";
import { getStoredDoctors, Doctor as StoreDoctor, QueueItem } from "@/lib/store";

const C = ({ style, ...p }: any) => (
  <div style={{ 
    background: "#fff", borderRadius: 20, border: "1px solid #f3e8e2", 
    boxShadow: "0 4px 20px rgba(243,232,226,0.25)", overflow: "hidden", ...style 
  }} {...p} />
);

const pillStyle = (c: string, b: string) => ({
  color: c, background: b, padding: "3px 10px", borderRadius: 20, fontSize: 10.5, fontWeight: 700, display: "inline-block"
});

export default function DashboardView() {
  const [activeChartTab, setActiveChartTab] = useState<"kunjungan" | "pendapatan">("kunjungan");
  const [doctorsList, setDoctorsList] = useState<StoreDoctor[]>([]);
  const [liveQueue, setLiveQueue] = useState<QueueItem[]>([]);
  
  // Real-time Metrics State
  const [patientCount, setPatientCount] = useState(0);
  const [todayApptCount, setTodayApptCount] = useState(0);
  const [activeQueueCount, setActiveQueueCount] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState(0);

  useEffect(() => {
    // Load Doctors
    setDoctorsList(getStoredDoctors());

    // Load Live Metrics & Tables
    const loadRealtimeMetrics = () => {
      const todayStr = new Date().toISOString().split("T")[0];

      // 1. Patients Count
      try {
        const cachedP = localStorage.getItem("clinic_patients_v1");
        const pList = cachedP ? JSON.parse(cachedP) : [];
        setPatientCount(pList.length);
      } catch (e) {}

      // 2. Today Appointments Count
      try {
        const cachedA = localStorage.getItem("clinic_appointments_v1");
        const aList = cachedA ? JSON.parse(cachedA) : [];
        const todayA = aList.filter((a: any) => a.date === todayStr);
        setTodayApptCount(todayA.length);
      } catch (e) {}

      // 3. Active Queue Count & Live Queue Table
      try {
        const cachedQ = localStorage.getItem("clinic_queue_v1");
        const qList: QueueItem[] = cachedQ ? JSON.parse(cachedQ) : [];
        const activeQ = qList.filter(q => q.status === "menunggu" || q.status === "dipanggil");
        setActiveQueueCount(activeQ.length);
        setLiveQueue(qList.slice(0, 5));
      } catch (e) {}

      // 4. Today Revenue Sum
      try {
        const cachedB = localStorage.getItem("clinic_billing_v1");
        const bList = cachedB ? JSON.parse(cachedB) : [];
        const lunasRev = bList
          .filter((b: any) => b.status === "Lunas")
          .reduce((acc: number, b: any) => acc + (b.total || 0), 0);
        setTodayRevenue(lunasRev);
      } catch (e) {}
    };

    loadRealtimeMetrics();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      
      {/* 4 STATS CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
        
        {/* Stat 1: Pasien Hari Ini */}
        <C style={{ padding: 20, position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: 12, color: "#64748b", fontWeight: 700, margin: 0 }}>Total Pasien Terdaftar</p>
              <h3 style={{ fontSize: 34, fontWeight: 900, color: "#0f172a", margin: "4px 0 0" }}>{patientCount}</h3>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #ff8c8c, #ff5757)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users style={{ width: 24, height: 24, color: "#fff" }} />
            </div>
          </div>
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "#10b981", fontSize: 11, fontWeight: 750, display: "flex", alignItems: "center" }}>
              ▲ Real-Time <span style={{ color: "#64748b", fontWeight: 600, marginLeft: 4 }}>terhubung ke database</span>
            </span>
          </div>
        </C>

        {/* Stat 2: Appointment Hari Ini */}
        <C style={{ padding: 20, position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: 12, color: "#64748b", fontWeight: 700, margin: 0 }}>Appointment Hari Ini</p>
              <h3 style={{ fontSize: 34, fontWeight: 900, color: "#0f172a", margin: "4px 0 0" }}>{todayApptCount}</h3>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #a5f3fc, #0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Calendar style={{ width: 24, height: 24, color: "#fff" }} />
            </div>
          </div>
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "#10b981", fontSize: 11, fontWeight: 750, display: "flex", alignItems: "center" }}>
              ▲ Real-Time <span style={{ color: "#64748b", fontWeight: 600, marginLeft: 4 }}>jadwal terkonfirmasi</span>
            </span>
          </div>
        </C>

        {/* Stat 3: Antrean Aktif */}
        <C style={{ padding: 20, position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: 12, color: "#64748b", fontWeight: 700, margin: 0 }}>Antrean Aktif Poli</p>
              <h3 style={{ fontSize: 34, fontWeight: 900, color: "#0f172a", margin: "4px 0 0" }}>{activeQueueCount}</h3>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #c084fc, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Clock style={{ width: 24, height: 24, color: "#fff" }} />
            </div>
          </div>
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "#8b5cf6", fontSize: 11, fontWeight: 750, display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#8b5cf6" }} />
              Menunggu & Dipanggil
            </span>
          </div>
        </C>

        {/* Stat 4: Pendapatan Hari Ini */}
        <C style={{ padding: 20, position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: 12, color: "#64748b", fontWeight: 700, margin: 0 }}>Pendapatan Kasir Lunas</p>
              <h3 style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", margin: "10px 0 0" }}>
                Rp {todayRevenue.toLocaleString("id-ID")}
              </h3>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #fcd34d, #f59e0b)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Wallet style={{ width: 24, height: 24, color: "#fff" }} />
            </div>
          </div>
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "#10b981", fontSize: 11, fontWeight: 750, display: "flex", alignItems: "center" }}>
              ▲ Real-Time <span style={{ color: "#64748b", fontWeight: 600, marginLeft: 4 }}>total penerimaan</span>
            </span>
          </div>
        </C>

      </div>

      {/* ROW 2: STATUS ANTREAN LIVE & JADWAL DOKTER */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
        
        {/* Card: Status Antrean Live */}
        <C style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 14.5, fontWeight: 800, color: "#0f172a", margin: 0 }}>Status Antrean Live Poli</h3>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#0d9488" }}>Terhubung Real-Time</span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 11.5, borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ color: "#64748b", fontWeight: 700, borderBottom: "1px solid #f3e8e2" }}>
                  <th style={{ padding: "8px 0" }}>No. Antrean</th>
                  <th style={{ padding: "8px 0" }}>Pasien</th>
                  <th style={{ padding: "8px 0" }}>Poli</th>
                  <th style={{ padding: "8px 0" }}>Status</th>
                </tr>
              </thead>
              <tbody style={{ fontWeight: 600, color: "#334155" }}>
                {liveQueue.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: 20, color: "#94a3b8" }}>Belum ada antrean poli aktif.</td>
                  </tr>
                ) : (
                  liveQueue.map((q) => (
                    <tr key={q.id} style={{ borderBottom: "1px solid #fdf8f5" }}>
                      <td style={{ padding: "9px 0", fontWeight: 800, color: "#0d9488" }}>{q.no}</td>
                      <td style={{ padding: "9px 0", fontWeight: 800, color: "#0f172a" }}>{q.name}</td>
                      <td style={{ padding: "9px 0", color: "#475569" }}>Poli {q.poli}</td>
                      <td style={{ padding: "9px 0" }}>
                        <span style={pillStyle(
                          q.status === "selesai" ? "#15803d" : q.status === "dipanggil" ? "#0369a1" : "#c2410c",
                          q.status === "selesai" ? "#dcfce7" : q.status === "dipanggil" ? "#e0f2fe" : "#fff7ed"
                        )}>
                          {q.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </C>

        {/* Card: Dokter Praktik */}
        <C style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 14.5, fontWeight: 800, color: "#0f172a", margin: 0 }}>Dokter Praktik Klinik</h3>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#0d9488" }}>{doctorsList.length} Dokter</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {doctorsList.slice(0, 5).map((d) => (
              <div key={d.id || d.name} style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: d.color || "#0d9488", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900 }}>
                    {d.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a" }}>{d.name}</div>
                    <div style={{ fontSize: 10, color: d.color || "#0d9488", fontWeight: 700 }}>Poli {d.poli}</div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <span style={pillStyle("#15803d", "#dcfce7")}>{d.status || "Aktif"}</span>
                  <span style={{ fontSize: 10, color: "#64748b", fontWeight: 600 }}>{d.sip || "SIP-2026"}</span>
                </div>
              </div>
            ))}
          </div>
        </C>

      </div>
    </div>
  );
}
