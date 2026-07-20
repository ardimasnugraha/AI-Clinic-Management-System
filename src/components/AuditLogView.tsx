"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, Search, Download } from "lucide-react";
import { AuditLog } from "@/lib/store";

const Container = ({ style, ...p }: any) => (
  <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e8f0fe", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", ...style }} {...p} />
);

const DEFAULT_LOGS: AuditLog[] = [
  { id: "LOG0001", timestamp: `${new Date().toLocaleDateString("id-ID")} 08:30`, user: "dr. Maya Lestari", action: "Login Sistem", module: "Auth", details: "Berhasil masuk ke Dashboard Utama" },
  { id: "LOG0002", timestamp: `${new Date().toLocaleDateString("id-ID")} 08:45`, user: "dr. Maya Lestari", action: "Pendaftaran Pasien", module: "Pasien", details: "Mendaftarkan pasien baru RM0001236 Budi Santoso" },
  { id: "LOG0003", timestamp: `${new Date().toLocaleDateString("id-ID")} 09:15`, user: "Staf Pendaftaran", action: "Ambil Tiket Antrean", module: "Antrean", details: "Menerbitkan tiket A-013 Poli Umum" },
  { id: "LOG0004", timestamp: `${new Date().toLocaleDateString("id-ID")} 09:40`, user: "dr. Maya Lestari", action: "Finalisasi Encounter", module: "Encounter", details: "Finalisasi rekam medis dan peresepan Amlodipine" },
];

export default function AuditLogView() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState("");
  const [selModule, setSelModule] = useState("Semua");

  useEffect(() => {
    try {
      const cached = localStorage.getItem("clinic_audit_logs_v1");
      if (cached) {
        setLogs(JSON.parse(cached));
      } else {
        setLogs(DEFAULT_LOGS);
        localStorage.setItem("clinic_audit_logs_v1", JSON.stringify(DEFAULT_LOGS));
      }
    } catch (e) {}
  }, []);

  const handleExportLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `audit_logs_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filtered = logs.filter(l => 
    (selModule === "Semua" || l.module === selModule) &&
    (!search || l.action.toLowerCase().includes(search.toLowerCase()) || l.details.toLowerCase().includes(search.toLowerCase()) || l.user.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>Modul Audit Log System</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "2px 0 0" }}>Jejak audit otomatis seluruh aktivitas dan transaksi dalam klinik</p>
        </div>
        <button onClick={handleExportLogs} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", borderRadius: 12, border: "1px solid #cbd5e1", background: "#fff", fontSize: 13, fontWeight: 700, color: "#475569", cursor: "pointer" }}>
          <Download style={{ width: 14, height: 14 }} /> Export Log JSON
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        {[
          { label: "Total Jejak Aktivitas", val: logs.length, color: "#0d9488", bg: "#e0f2fe" },
          { label: "Transaksi Dokter", val: logs.filter(l => l.module === "Encounter" || l.module === "Dokter").length, color: "#8b5cf6", bg: "#ede9fe" },
          { label: "Transaksi Antrean & Pasien", val: logs.filter(l => l.module === "Pasien" || l.module === "Antrean").length, color: "#f97316", bg: "#fff7ed" },
          { label: "Sistem & Security", val: logs.filter(l => l.module === "System" || l.module === "Auth").length, color: "#22c55e", bg: "#f0fdf4" },
        ].map((s, i) => (
          <Container key={i} style={{ padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ShieldCheck style={{ width: 20, height: 20, color: s.color }} />
              </div>
              <div>
                <p style={{ fontSize: 11, color: "#64748b", fontWeight: 600, margin: 0 }}>{s.label}</p>
                <h3 style={{ fontSize: 24, fontWeight: 800, color: s.color, margin: 0 }}>{s.val}</h3>
              </div>
            </div>
          </Container>
        ))}
      </div>

      {/* Filter Toolbar */}
      <Container style={{ padding: 16 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#94a3b8" }} />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Cari aktivitas, rincian, atau staf pengguna..."
              style={{ width: "100%", paddingLeft: 34, paddingRight: 16, paddingTop: 8.5, paddingBottom: 8.5, borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8fafc", fontSize: 12.5, outline: "none" }} 
            />
          </div>

          {["Semua", "Pasien", "Antrean", "Encounter", "Dokter", "Kasir / Billing", "System"].map(m => (
            <button 
              key={m} 
              onClick={() => setSelModule(m)} 
              style={{ 
                padding: "7px 14px", borderRadius: 10, border: "1.5px solid", fontSize: 12, fontWeight: 600, cursor: "pointer",
                borderColor: selModule === m ? "#0d9488" : "#e2e8f0", background: selModule === m ? "#0d9488" : "#fff", color: selModule === m ? "#fff" : "#64748b" 
              }}>
              {m}
            </button>
          ))}
        </div>
      </Container>

      {/* Table */}
      <Container style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["ID Log", "Pengguna / Staf", "Aksi Transaksi", "Modul", "Detail Rincian Aktivitas", "Waktu"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#64748b", borderBottom: "1px solid #e8f0fe" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 36, color: "#94a3b8" }}>
                    Belum ada rekaman audit log.
                  </td>
                </tr>
              ) : (
                filtered.map((l) => (
                  <tr key={l.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <td style={{ padding: "12px 16px", color: "#64748b", fontWeight: 700, fontSize: 11.5 }}>{l.id}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 800, color: "#0f172a" }}>{l.user}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0d9488" }}>{l.action}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: "#e0f2fe", color: "#0369a1", borderRadius: 8, padding: "3px 8px", fontSize: 11, fontWeight: 700 }}>
                        {l.module}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#475569" }}>{l.details}</td>
                    <td style={{ padding: "12px 16px", color: "#64748b", fontSize: 11.5, whiteSpace: "nowrap" }}>{l.timestamp}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Container>
    </div>
  );
}
