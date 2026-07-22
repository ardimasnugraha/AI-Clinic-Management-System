"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, Search, Download, RefreshCw } from "lucide-react";
import { AuditLog } from "@/lib/store";
import { supabase } from "@/lib/supabase/client";

const Container = ({ style, ...p }: any) => (
  <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e8f0fe", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", ...style }} {...p} />
);

export default function AuditLogView() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState("");
  const [selModule, setSelModule] = useState("Semua");
  const [loading, setLoading] = useState(false);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (!error && data) {
        const mappedLogs: AuditLog[] = data.map((item: any, idx: number) => {
          const createdAt = item.created_at ? new Date(item.created_at) : new Date();
          const timeStr = `${String(createdAt.getHours()).padStart(2, "0")}:${String(createdAt.getMinutes()).padStart(2, "0")}`;
          const dateStr = `${createdAt.toLocaleDateString("id-ID")} ${timeStr}`;
          const meta = item.metadata || {};

          return {
            id: item.id ? `LOG${String(item.id).slice(-4)}` : `LOG${String(idx+1).padStart(4, "0")}`,
            timestamp: meta.timestamp || dateStr,
            user: meta.user || item.actor_role || "Staf Klinik",
            action: item.action || "Aktivitas Sistem",
            module: item.resource_type || "System",
            details: meta.details || `Transaksi resource ${item.resource_type || ""}`
          };
        });
        setLogs(mappedLogs);
        localStorage.setItem("clinic_audit_logs_v1", JSON.stringify(mappedLogs));
      } else {
        const cached = localStorage.getItem("clinic_audit_logs_v1");
        if (cached) setLogs(JSON.parse(cached));
      }
    } catch (e) {
      console.warn("Error fetching audit logs from Supabase", e);
      const cached = localStorage.getItem("clinic_audit_logs_v1");
      if (cached) setLogs(JSON.parse(cached));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
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
          <p style={{ fontSize: 13, color: "#64748b", margin: "2px 0 0" }}>Jejak audit otomatis seluruh aktivitas dan transaksi dalam klinik (Tersinkron dengan Supabase)</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={fetchAuditLogs} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 12, border: "1px solid #cbd5e1", background: "#fff", fontSize: 13, fontWeight: 700, color: "#475569", cursor: "pointer" }}>
            <RefreshCw style={{ width: 14, height: 14, animation: loading ? "spin 1s linear infinite" : "none" }} /> Refresh
          </button>
          <button onClick={handleExportLogs} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", borderRadius: 12, border: "1px solid #cbd5e1", background: "#fff", fontSize: 13, fontWeight: 700, color: "#475569", cursor: "pointer" }}>
            <Download style={{ width: 14, height: 14 }} /> Export Log JSON
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        {[
          { label: "Total Jejak Aktivitas", val: logs.length, color: "#0d9488", bg: "#e0f2fe" },
          { label: "Transaksi Dokter", val: logs.filter(l => l.module === "Encounter" || l.module === "Dokter").length, color: "#8b5cf6", bg: "#ede9fe" },
          { label: "Transaksi Antrean & Pasien", val: logs.filter(l => l.module === "Pasien" || l.module === "Antrean").length, color: "#f97316", bg: "#fff7ed" },
          { label: "Sistem & Security", val: logs.filter(l => l.module === "System" || l.module === "Auth" || l.module === "Laboratorium" || l.module === "Farmasi").length, color: "#22c55e", bg: "#f0fdf4" },
        ].map((s, i) => (
          <Container key={i} style={{ padding: 18, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <ShieldCheck style={{ width: 22, height: 22, color: s.color }} />
            </div>
            <div>
              <p style={{ fontSize: 11.5, color: "#64748b", fontWeight: 600, margin: 0 }}>{s.label}</p>
              <h3 style={{ fontSize: 24, fontWeight: 800, color: s.color, margin: 0 }}>{s.val}</h3>
            </div>
          </Container>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["Semua", "Pasien", "Antrean", "Encounter", "Dokter", "Farmasi", "Laboratorium", "Auth", "System"].map(m => (
            <button 
              key={m}
              onClick={() => setSelModule(m)}
              style={{
                padding: "8px 16px", borderRadius: 20, border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer",
                background: selModule === m ? "#0d9488" : "#f1f5f9", color: selModule === m ? "#fff" : "#64748b"
              }}>
              {m}
            </button>
          ))}
        </div>

        <div style={{ position: "relative", width: 260 }}>
          <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "#94a3b8" }} />
          <input 
            type="text" 
            placeholder="Cari aktivitas, pengolah, detail..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "8px 14px 8px 36px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 12.5 }}
          />
        </div>
      </div>

      {/* Table */}
      <Container style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["ID Log", "Waktu Aktivitas", "User / Pelaku", "Aksi Aktivitas", "Modul", "Detail Rincian"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#64748b", borderBottom: "1px solid #e8f0fe" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 36, color: "#94a3b8" }}>
                    Belum ada catatan log aktivitas dalam sistem.
                  </td>
                </tr>
              ) : (
                filtered.map(l => (
                  <tr key={l.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <td style={{ padding: "12px 16px", color: "#0d9488", fontWeight: 800 }}>{l.id}</td>
                    <td style={{ padding: "12px 16px", color: "#64748b", fontWeight: 600 }}>{l.timestamp}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0f172a" }}>{l.user}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#334155" }}>{l.action}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: "#e0f2fe", color: "#0369a1", borderRadius: 12, padding: "3px 10px", fontSize: 11, fontWeight: 800 }}>
                        {l.module}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#475569" }}>{l.details}</td>
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
