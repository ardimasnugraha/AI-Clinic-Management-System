"use client";

import React, { useState, useEffect } from "react";
import { FlaskConical, Plus, Search, CheckCircle2, Clock, AlertTriangle, Download, Eye, Printer, Check } from "lucide-react";
import { logAuditEvent } from "@/lib/store";

const Container = ({ style, ...p }: any) => (
  <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e8f0fe", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", ...style }} {...p} />
);

export interface LabTestOrder {
  id: string;
  patientName: string;
  patientRm: string;
  testName: string;
  doctorName: string;
  date: string;
  status: "menunggu" | "proses" | "selesai" | "abnormal";
  resultValue?: string;
  normalRange?: string;
  notes?: string;
}

const DEFAULT_TESTS: LabTestOrder[] = [
  { id: "LAB001", patientName: "Andi Pratama", patientRm: "RM0001234", testName: "Darah Lengkap & Hb", doctorName: "dr. Maya Lestari", date: new Date().toISOString().split("T")[0], status: "selesai", resultValue: "Hb: 14.2 g/dL, Leukosit: 7.500", normalRange: "Hb: 13-17 g/dL", notes: "Dalam batas normal" },
  { id: "LAB002", patientName: "Dewi Sartika", patientRm: "RM0001237", testName: "Gula Darah Puasa (GDP)", doctorName: "dr. Ahmad Rizki", date: new Date().toISOString().split("T")[0], status: "proses", resultValue: "-", normalRange: "70-110 mg/dL", notes: "Sampel sedang diuji" },
  { id: "LAB003", patientName: "Budi Santoso", patientRm: "RM0001236", testName: "Profil Lipid (Kolesterol Total)", doctorName: "dr. Maya Lestari", date: new Date().toISOString().split("T")[0], status: "menunggu", resultValue: "-", normalRange: "< 200 mg/dL", notes: "Puasa 10 jam" },
];

export default function LabView() {
  const [tests, setTests] = useState<LabTestOrder[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showResultModal, setShowResultModal] = useState<LabTestOrder | null>(null);
  const [registeredPatients, setRegisteredPatients] = useState<any[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    patientRm: "",
    patientName: "",
    doctorName: "dr. Maya Lestari",
    testName: "Darah Lengkap",
    notes: ""
  });

  // Result Entry Form State
  const [resultInput, setResultInput] = useState({ value: "", range: "Normal", status: "selesai" as const });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    try {
      const cached = localStorage.getItem("clinic_lab_v1");
      if (cached) {
        setTests(JSON.parse(cached));
      } else {
        setTests(DEFAULT_TESTS);
        localStorage.setItem("clinic_lab_v1", JSON.stringify(DEFAULT_TESTS));
      }
    } catch (e) {}

    try {
      const p = localStorage.getItem("clinic_patients_v1");
      if (p) setRegisteredPatients(JSON.parse(p));
    } catch (e) {}
  }, []);

  const saveTests = (updated: LabTestOrder[]) => {
    setTests(updated);
    try { localStorage.setItem("clinic_lab_v1", JSON.stringify(updated)); } catch (e) {}
  };

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientName.trim()) {
      alert("Nama Pasien wajib diisi.");
      return;
    }

    const newLab: LabTestOrder = {
      id: `LAB${String(tests.length + 1).padStart(3, '0')}`,
      patientName: formData.patientName,
      patientRm: formData.patientRm || `RM000${Math.floor(1000 + Math.random() * 9000)}`,
      testName: formData.testName,
      doctorName: formData.doctorName,
      date: new Date().toISOString().split("T")[0],
      status: "menunggu",
      notes: formData.notes
    };

    saveTests([newLab, ...tests]);
    setShowForm(false);
    showToast(`Order Pemeriksaan Lab ${newLab.id} (${newLab.testName}) berhasil dibuat!`);
    logAuditEvent("Order Lab Baru", "Laboratorium", `Order lab ${newLab.id} untuk ${newLab.patientName}`);
  };

  const handleSaveResult = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showResultModal) return;

    const updated = tests.map(t => {
      if (t.id === showResultModal.id) {
        return {
          ...t,
          status: resultInput.status,
          resultValue: resultInput.value || "Hasil laboratorium terverifikasi normal.",
          normalRange: resultInput.range
        };
      }
      return t;
    });

    saveTests(updated);
    showToast(`Hasil Lab ${showResultModal.id} berhasil disimpan!`);
    setShowResultModal(null);
  };

  const filtered = tests.filter(t => 
    t.patientName.toLowerCase().includes(search.toLowerCase()) ||
    t.testName.toLowerCase().includes(search.toLowerCase()) ||
    t.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Toast */}
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>Modul Laboratorium Klinik</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "2px 0 0" }}>Manajemen permintaan tes darah, spesimen, dan laporan hasil lab</p>
        </div>
        <button onClick={() => setShowForm(true)} style={{ display: "flex", alignItems: "center", gap: 8, background: "#0d9488", color: "#fff", border: "none", borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(13,148,136,0.25)" }}>
          <Plus style={{ width: 16, height: 16 }} /> Order Tes Lab Baru
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        {[
          { label: "Total Order Lab", val: tests.length, color: "#0d9488", bg: "#e0f2fe", icon: FlaskConical },
          { label: "Selesai Verifikasi", val: tests.filter(t => t.status === "selesai").length, color: "#22c55e", bg: "#f0fdf4", icon: CheckCircle2 },
          { label: "Dalam Proses Uji", val: tests.filter(t => t.status === "proses" || t.status === "menunggu").length, color: "#f97316", bg: "#fff7ed", icon: Clock },
          { label: "Hasil Abnormal", val: tests.filter(t => t.status === "abnormal").length, color: "#ef4444", bg: "#fef2f2", icon: AlertTriangle },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <Container key={i} style={{ padding: 18, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon style={{ width: 22, height: 22, color: s.color }} />
              </div>
              <div>
                <p style={{ fontSize: 11.5, color: "#64748b", fontWeight: 600, margin: 0 }}>{s.label}</p>
                <h3 style={{ fontSize: 26, fontWeight: 800, color: s.color, margin: 0 }}>{s.val}</h3>
              </div>
            </Container>
          );
        })}
      </div>

      {/* Filter Toolbar */}
      <Container style={{ padding: 16 }}>
        <div style={{ position: "relative" }}>
          <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#94a3b8" }} />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Cari pasien atau jenis tes lab..."
            style={{ width: "100%", paddingLeft: 34, paddingRight: 16, paddingTop: 9, paddingBottom: 9, borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8fafc", fontSize: 13, outline: "none" }} 
          />
        </div>
      </Container>

      {/* Lab Table */}
      <Container style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["ID Tes", "Pasien", "Jenis Pemeriksaan", "Dokter Pengirim", "Tanggal Order", "Status", "Aksi"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#64748b", borderBottom: "1px solid #e8f0fe" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 36, color: "#94a3b8" }}>
                    Tidak ada data tes laboratorium.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 800, color: "#0d9488" }}>{t.id}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 800, color: "#0f172a" }}>{t.patientName}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{t.patientRm}</div>
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#334155" }}>{t.testName}</td>
                    <td style={{ padding: "12px 16px", color: "#64748b" }}>{t.doctorName}</td>
                    <td style={{ padding: "12px 16px", color: "#64748b" }}>{t.date}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ 
                        background: t.status === "selesai" ? "#dcfce7" : t.status === "abnormal" ? "#fef2f2" : "#fff7ed",
                        color: t.status === "selesai" ? "#15803d" : t.status === "abnormal" ? "#dc2626" : "#c2410c",
                        borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 800 
                      }}>
                        {t.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        {t.status === "selesai" || t.status === "abnormal" ? (
                          <button 
                            onClick={() => {
                              alert(`Laporan Hasil Lab ${t.id}:\n${t.resultValue || "Normal"}`);
                            }}
                            style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", fontSize: 11, fontWeight: 700, color: "#334155", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                            <Printer style={{ width: 12, height: 12 }} /> Hasil PDF
                          </button>
                        ) : (
                          <button 
                            onClick={() => {
                              setShowResultModal(t);
                              setResultInput({ value: "", range: "Normal", status: "selesai" });
                            }}
                            style={{ padding: "5px 12px", borderRadius: 8, border: "none", background: "#0d9488", color: "#fff", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
                            Input Hasil
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

      {/* CREATE LAB ORDER MODAL */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <Container style={{ width: 450, padding: 26 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>Order Pemeriksaan Lab Baru</h2>
              <button onClick={() => setShowForm(false)} style={{ border: "none", background: "#f1f5f9", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13, color: "#64748b", fontWeight: 700 }}>✕</button>
            </div>

            <form onSubmit={handleOrderSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Pilih Pasien Terdaftar</label>
                <select 
                  onChange={e => {
                    const found = registeredPatients.find(p => p.rm === e.target.value);
                    if (found) setFormData({ ...formData, patientRm: found.rm, patientName: found.name });
                  }}
                  style={{ width: "100%", padding: "9.5px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none" }}>
                  <option value="">-- Pilih Pasien --</option>
                  {registeredPatients.map(p => <option key={p.rm} value={p.rm}>{p.name} ({p.rm})</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Nama Pasien *</label>
                <input 
                  type="text" required value={formData.patientName} 
                  onChange={e => setFormData({ ...formData, patientName: e.target.value })}
                  style={{ width: "100%", padding: "9.5px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none" }} 
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Jenis Pemeriksaan Lab *</label>
                <select 
                  value={formData.testName} 
                  onChange={e => setFormData({ ...formData, testName: e.target.value })}
                  style={{ width: "100%", padding: "9.5px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none" }}>
                  <option value="Darah Lengkap & Hb">Darah Lengkap & Hb</option>
                  <option value="Gula Darah Puasa (GDP)">Gula Darah Puasa (GDP)</option>
                  <option value="Profil Lipid (Kolesterol Total)">Profil Lipid (Kolesterol Total)</option>
                  <option value="Fungsi Ginjal (Ureum/Kreatinin)">Fungsi Ginjal (Ureum/Kreatinin)</option>
                  <option value="Urinalisis Lengkap">Urinalisis Lengkap</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 700, color: "#64748b" }}>Batal</button>
                <button type="submit" style={{ flex: 2, padding: "10px 0", borderRadius: 10, border: "none", background: "#0d9488", color: "#fff", fontSize: 13, fontWeight: 800 }}>Order Pemeriksaan</button>
              </div>
            </form>
          </Container>
        </div>
      )}

      {/* INPUT LAB RESULT MODAL */}
      {showResultModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <Container style={{ width: 440, padding: 26 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: 0 }}>Input Hasil Laboratorium</h2>
                <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>{showResultModal.id} — {showResultModal.patientName} ({showResultModal.testName})</p>
              </div>
              <button onClick={() => setShowResultModal(null)} style={{ border: "none", background: "#f1f5f9", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>✕</button>
            </div>

            <form onSubmit={handleSaveResult} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Hasil Pengujian Spesimen *</label>
                <textarea 
                  rows={3} required
                  value={resultInput.value} 
                  onChange={e => setResultInput({ ...resultInput, value: e.target.value })}
                  placeholder="Ketik angka / hasil analisis..."
                  style={{ width: "100%", padding: "9.5px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none" }} 
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Kesimpulan Hasil</label>
                <select 
                  value={resultInput.status} 
                  onChange={e => setResultInput({ ...resultInput, status: e.target.value as any })}
                  style={{ width: "100%", padding: "9.5px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none", fontWeight: 700 }}>
                  <option value="selesai">Normal (Selesai Verifikasi)</option>
                  <option value="abnormal">Abnormal (Perlu Perhatian)</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowResultModal(null)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 700, color: "#64748b" }}>Batal</button>
                <button type="submit" style={{ flex: 2, padding: "10px 0", borderRadius: 10, border: "none", background: "#0d9488", color: "#fff", fontSize: 13, fontWeight: 800 }}>Simpan & Verifikasi Hasil</button>
              </div>
            </form>
          </Container>
        </div>
      )}
    </div>
  );
}
