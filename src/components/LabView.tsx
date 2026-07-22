"use client";

import React, { useState, useEffect } from "react";
import { FlaskConical, Plus, Search, CheckCircle2, Clock, AlertTriangle, Download, Eye, Printer, Check } from "lucide-react";
import { logAuditEvent } from "@/lib/store";
import { supabase } from "@/lib/supabase/client";

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
  const [resultInput, setResultInput] = useState<{ value: string; range: string; status: "selesai" | "abnormal" }>({ value: "", range: "Normal", status: "selesai" });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadLabData = async () => {
    // Load registered patients
    try {
      const { data: pData } = await supabase.from("patients").select("*").order("full_name", { ascending: true });
      if (pData) {
        setRegisteredPatients(pData.map((p: any) => ({ rm: p.medical_record_number, name: p.full_name })));
      } else {
        const p = localStorage.getItem("clinic_patients_v1");
        if (p) setRegisteredPatients(JSON.parse(p));
      }
    } catch (e) {}

    // Load Lab Orders from Supabase
    try {
      const { data, error } = await supabase
        .from("lab_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        const mappedLab: LabTestOrder[] = data.map((l: any) => ({
          id: l.lab_no || l.id,
          patientName: l.patient_name,
          patientRm: l.patient_rm,
          testName: l.test_name,
          doctorName: l.doctor_name,
          date: l.date,
          status: l.status,
          resultValue: l.result_value,
          normalRange: l.normal_range || "Normal",
          notes: l.notes
        }));
        setTests(mappedLab);
        localStorage.setItem("clinic_lab_v1", JSON.stringify(mappedLab));
      } else {
        const cached = localStorage.getItem("clinic_lab_v1");
        if (cached) setTests(JSON.parse(cached));
      }
    } catch (e) {
      console.warn("Error fetching lab orders from Supabase", e);
    }
  };

  useEffect(() => {
    loadLabData();
  }, []);

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientName.trim()) {
      alert("Nama Pasien wajib diisi.");
      return;
    }

    const labId = `LAB${String(tests.length + 1).padStart(3, '0')}`;
    const todayStr = new Date().toISOString().split("T")[0];

    const newLab: LabTestOrder = {
      id: labId,
      patientName: formData.patientName,
      patientRm: formData.patientRm || `RM000${Math.floor(1000 + Math.random() * 9000)}`,
      testName: formData.testName,
      doctorName: formData.doctorName,
      date: todayStr,
      status: "menunggu",
      notes: formData.notes
    };

    // Save to Supabase
    try {
      await supabase.from("lab_orders").insert([{
        clinic_id: "11111111-1111-1111-1111-111111111111",
        lab_no: labId,
        patient_rm: newLab.patientRm,
        patient_name: newLab.patientName,
        doctor_name: newLab.doctorName,
        test_name: newLab.testName,
        date: todayStr,
        status: "menunggu",
        notes: newLab.notes
      }]);
    } catch (e) {
      console.warn("Error inserting lab order to Supabase", e);
    }

    const updated = [newLab, ...tests];
    setTests(updated);
    try { localStorage.setItem("clinic_lab_v1", JSON.stringify(updated)); } catch (e) {}

    setShowForm(false);
    showToast(`Order Pemeriksaan Lab ${newLab.id} (${newLab.testName}) berhasil dibuat!`);
    logAuditEvent("Order Lab Baru", "Laboratorium", `Order lab ${newLab.id} untuk ${newLab.patientName}`);
  };

  const handleSaveResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showResultModal) return;

    const updated = tests.map(t => {
      if (t.id === showResultModal.id) {
        return {
          ...t,
          resultValue: resultInput.value,
          normalRange: resultInput.range,
          status: resultInput.status
        };
      }
      return t;
    });

    setTests(updated);
    try { localStorage.setItem("clinic_lab_v1", JSON.stringify(updated)); } catch (e) {}

    try {
      await supabase.from("lab_orders").update({
        result_value: resultInput.value,
        normal_range: resultInput.range,
        status: resultInput.status
      }).or(`lab_no.eq.${showResultModal.id},id.eq.${showResultModal.id}`);
    } catch (e) {}

    showToast(`Hasil pemeriksaan ${showResultModal.id} berhasil disimpan!`);
    logAuditEvent("Entri Hasil Lab", "Laboratorium", `Memasukkan hasil lab ${showResultModal.id} pasien ${showResultModal.patientName}`);
    setShowResultModal(null);
  };

  const pendingCount = tests.filter(t => t.status === "menunggu" || t.status === "proses").length;
  const doneCount = tests.filter(t => t.status === "selesai").length;
  const abnormalCount = tests.filter(t => t.status === "abnormal").length;

  const filtered = tests.filter(t => 
    !search || 
    t.patientName.toLowerCase().includes(search.toLowerCase()) || 
    t.patientRm.toLowerCase().includes(search.toLowerCase()) ||
    t.testName.toLowerCase().includes(search.toLowerCase()) ||
    t.id.toLowerCase().includes(search.toLowerCase())
  );

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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>Modul Laboratorium Klinik</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "2px 0 0" }}>Kelola sampel pemeriksaan darah, urine, & entri hasil tes laboratorium</p>
        </div>

        <button 
          onClick={() => setShowForm(true)}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "#0d9488", color: "#fff", border: "none", borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(13,148,136,0.25)" }}>
          <Plus style={{ width: 16, height: 16 }} /> Order Tes Lab Baru
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        {[
          { label: "Total Permintaan Lab", val: tests.length, color: "#0d9488", bg: "#e0f2fe", icon: FlaskConical },
          { label: "Menunggu / Dalam Proses", val: pendingCount, color: "#f97316", bg: "#fff7ed", icon: Clock },
          { label: "Pemeriksaan Selesai", val: doneCount, color: "#22c55e", bg: "#f0fdf4", icon: CheckCircle2 },
          { label: "Hasil Abnormal", val: abnormalCount, color: "#ef4444", bg: "#fef2f2", icon: AlertTriangle },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <Container key={i} style={{ padding: 18, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon style={{ width: 22, height: 22, color: s.color }} />
              </div>
              <div>
                <p style={{ fontSize: 11.5, color: "#64748b", fontWeight: 600, margin: 0 }}>{s.label}</p>
                <h3 style={{ fontSize: 24, fontWeight: 800, color: s.color, margin: 0 }}>{s.val}</h3>
              </div>
            </Container>
          );
        })}
      </div>

      {/* Search Bar */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div style={{ position: "relative", width: 280 }}>
          <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "#94a3b8" }} />
          <input 
            type="text" 
            placeholder="Cari ID Lab, nama pasien, tes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "9px 14px 9px 36px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: 12.5 }}
          />
        </div>
      </div>

      {/* Table */}
      <Container style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["ID Order", "Pasien & RM", "Jenis Pemeriksaan", "Dokter Perujuk", "Tanggal", "Status", "Hasil Pemeriksaan", "Aksi"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#64748b", borderBottom: "1px solid #e8f0fe" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 36, color: "#94a3b8" }}>
                    Belum ada order permintaan pemeriksaan laboratorium.
                  </td>
                </tr>
              ) : (
                filtered.map(t => (
                  <tr key={t.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <td style={{ padding: "12px 16px", color: "#0d9488", fontWeight: 800 }}>{t.id}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 800, color: "#0f172a" }}>{t.patientName}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{t.patientRm}</div>
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#334155" }}>{t.testName}</td>
                    <td style={{ padding: "12px 16px", color: "#475569" }}>{t.doctorName}</td>
                    <td style={{ padding: "12px 16px", color: "#64748b" }}>{t.date}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ 
                        background: t.status === "selesai" ? "#dcfce7" : t.status === "abnormal" ? "#fef2f2" : "#fff7ed",
                        color: t.status === "selesai" ? "#15803d" : t.status === "abnormal" ? "#dc2626" : "#c2410c",
                        borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 800 
                      }}>
                        {t.status === "selesai" ? "Selesai" : t.status === "abnormal" ? "Abnormal" : t.status === "proses" ? "Diproses" : "Menunggu"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {t.resultValue ? (
                        <div>
                          <div style={{ fontWeight: 800, color: t.status === "abnormal" ? "#dc2626" : "#0f172a" }}>{t.resultValue}</div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>Acuan: {t.normalRange}</div>
                        </div>
                      ) : (
                        <span style={{ color: "#94a3b8", fontStyle: "italic", fontSize: 12 }}>Belum diisi</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <button 
                        onClick={() => {
                          setShowResultModal(t);
                          setResultInput({ value: t.resultValue || "", range: t.normalRange || "Normal", status: t.status === "abnormal" ? "abnormal" : "selesai" });
                        }}
                        style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: "#0d9488", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                        {t.resultValue ? "Edit Hasil" : "Isi Hasil Lab"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Container>

      {/* Modal Order Lab Baru */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 480, padding: 24, boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "0 0 16px" }}>Order Pemeriksaan Lab Baru</h3>
            
            <form onSubmit={handleOrderSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Pilih Pasien Terdaftar *</label>
                {registeredPatients.length > 0 ? (
                  <select 
                    required
                    onChange={e => {
                      const sel = registeredPatients.find(p => p.name === e.target.value);
                      setFormData({ ...formData, patientName: e.target.value, patientRm: sel ? sel.rm : "" });
                    }}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 13, background: "#fff" }}>
                    <option value="">-- Pilih Pasien --</option>
                    {registeredPatients.map((p, idx) => (
                      <option key={idx} value={p.name}>{p.name} ({p.rm})</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    required
                    placeholder="Nama Pasien"
                    value={formData.patientName} 
                    onChange={e => setFormData({ ...formData, patientName: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 13 }} 
                  />
                )}
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Jenis Pemeriksaan Lab *</label>
                <select 
                  value={formData.testName}
                  onChange={e => setFormData({ ...formData, testName: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 13, background: "#fff" }}>
                  <option value="Darah Lengkap & Hb">Darah Lengkap & Hb</option>
                  <option value="Gula Darah Puasa / Sewaktu">Gula Darah Puasa / Sewaktu</option>
                  <option value="Kolesterol Total & Profil Lipid">Kolesterol Total & Profil Lipid</option>
                  <option value="Asam Urat">Asam Urat</option>
                  <option value="Fungsi Ginjal (Ureum & Kreatinin)">Fungsi Ginjal (Ureum & Kreatinin)</option>
                  <option value="Tes Urine Lengkap">Tes Urine Lengkap</option>
                  <option value="Widal / Typoid Test">Widal / Typoid Test</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Catatan / Indikasi Klinis</label>
                <textarea 
                  rows={2}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Catatan tambahan untuk petugas lab..."
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 13, fontFamily: "inherit" }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 10 }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontWeight: 700, cursor: "pointer" }}>
                  Batal
                </button>
                <button type="submit" style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "#0d9488", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
                  Kirim Order Lab
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Entri Hasil Lab */}
      {showResultModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 460, padding: 24, boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>Entri Hasil Lab: {showResultModal.id}</h3>
            <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 16px" }}>Pasien: {showResultModal.patientName} • {showResultModal.testName}</p>

            <form onSubmit={handleSaveResult} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Nilai Hasil Pemeriksaan *</label>
                <input 
                  type="text"
                  required
                  placeholder="Contoh: Hb 14.2 g/dL (Normal) atau GDA 210 mg/dL"
                  value={resultInput.value}
                  onChange={e => setResultInput({ ...resultInput, value: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Nilai Rujukan / Acuan</label>
                <input 
                  type="text"
                  placeholder="Contoh: L: 13-17 g/dL, P: 12-15 g/dL"
                  value={resultInput.range}
                  onChange={e => setResultInput({ ...resultInput, range: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Kesimpulan Status Hasil</label>
                <select 
                  value={resultInput.status}
                  onChange={e => setResultInput({ ...resultInput, status: e.target.value as any })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 13, background: "#fff" }}>
                  <option value="selesai">Normal / Selesai</option>
                  <option value="abnormal">Abnormal / Perlu Perhatian Dokter</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 10 }}>
                <button type="button" onClick={() => setShowResultModal(null)} style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontWeight: 700, cursor: "pointer" }}>
                  Batal
                </button>
                <button type="submit" style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "#0d9488", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
                  Simpan Hasil Lab
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
