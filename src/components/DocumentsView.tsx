"use client";

import React, { useState, useEffect } from "react";
import { FileText, Plus, Search, Download, Eye, Trash2, Printer, CheckCircle2, Check } from "lucide-react";
import { logAuditEvent, getStoredDoctors } from "@/lib/store";

const Container = ({ style, ...p }: any) => (
  <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e8f0fe", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", ...style }} {...p} />
);

export interface ClinicDocument {
  id: string;
  nama: string;
  tipe: "Surat Sakit" | "Surat Rujukan" | "Surat Sehat" | "Hasil Lab" | "Rekam Medis";
  ukuran: string;
  tgl: string;
  pasien: string;
  dokter: string;
  detailInfo?: string;
  color: string;
  ext: string;
}

const DEFAULT_DOCUMENTS: ClinicDocument[] = [
  { id: "DOC001", nama: "Surat Keterangan Sakit - Budi Santoso", tipe: "Surat Sakit", ukuran: "180 KB", tgl: new Date().toISOString().split("T")[0], pasien: "Budi Santoso", dokter: "dr. Maya Lestari", detailInfo: "Istirahat selama 3 hari dari tanggal 20-22 Juli 2026 karena Hipertensi.", color: "#0d9488", ext: "PDF" },
  { id: "DOC002", nama: "Surat Rujukan RS - Andi Pratama", tipe: "Surat Rujukan", ukuran: "240 KB", tgl: new Date().toISOString().split("T")[0], pasien: "Andi Pratama", dokter: "dr. Maya Lestari", detailInfo: "Rujukan ke Sp.PD RS Kariadi Semarang untuk penanganan lanjut.", color: "#8b5cf6", ext: "PDF" },
  { id: "DOC003", nama: "Surat Keterangan Sehat - Dewi Sartika", tipe: "Surat Sehat", ukuran: "150 KB", tgl: new Date().toISOString().split("T")[0], pasien: "Dewi Sartika", dokter: "drg. Sari Dewi", detailInfo: "Dinyatakan sehat untuk keperluan kelengkapan dokumen kerja.", color: "#22c55e", ext: "PDF" },
];

export default function DocumentsView() {
  const [documents, setDocuments] = useState<ClinicDocument[]>([]);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("Semua");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewDoc, setViewDoc] = useState<ClinicDocument | null>(null);
  const [registeredPatients, setRegisteredPatients] = useState<any[]>([]);
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Form State
  const [docForm, setDocForm] = useState({
    tipe: "Surat Sakit" as ClinicDocument["tipe"],
    pasien: "",
    dokter: "dr. Maya Lestari",
    detailInfo: "Diberikan istirahat selama 2 hari karena kondisi kesehatan."
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    try {
      const cached = localStorage.getItem("clinic_documents_v1");
      if (cached) {
        setDocuments(JSON.parse(cached));
      } else {
        setDocuments(DEFAULT_DOCUMENTS);
        localStorage.setItem("clinic_documents_v1", JSON.stringify(DEFAULT_DOCUMENTS));
      }
    } catch (e) {}

    try {
      const p = localStorage.getItem("clinic_patients_v1");
      if (p) setRegisteredPatients(JSON.parse(p));
    } catch (e) {}

    setDoctorsList(getStoredDoctors());
  }, []);

  const saveDocs = (updated: ClinicDocument[]) => {
    setDocuments(updated);
    try { localStorage.setItem("clinic_documents_v1", JSON.stringify(updated)); } catch (e) {}
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docForm.pasien.trim()) {
      alert("Nama Pasien wajib diisi.");
      return;
    }

    const typeColors: Record<string, string> = {
      "Surat Sakit": "#0d9488",
      "Surat Rujukan": "#8b5cf6",
      "Surat Sehat": "#22c55e",
      "Hasil Lab": "#3b82f6",
      "Rekam Medis": "#f97316"
    };

    const newDoc: ClinicDocument = {
      id: `DOC${String(documents.length + 1).padStart(3, '0')}`,
      nama: `${docForm.tipe} - ${docForm.pasien}`,
      tipe: docForm.tipe,
      ukuran: "210 KB",
      tgl: new Date().toISOString().split("T")[0],
      pasien: docForm.pasien,
      dokter: docForm.dokter,
      detailInfo: docForm.detailInfo,
      color: typeColors[docForm.tipe] || "#0d9488",
      ext: "PDF"
    };

    saveDocs([newDoc, ...documents]);
    setShowCreateModal(false);
    showToast(`Dokumen ${newDoc.tipe} untuk ${docForm.pasien} berhasil dibuat!`);
    logAuditEvent("Buat Dokumen Medis", "Dokumen", `Membuat ${newDoc.nama}`);
  };

  const handleDelete = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus dokumen ini?")) {
      const updated = documents.filter(d => d.id !== id);
      saveDocs(updated);
      showToast("Dokumen berhasil dihapus.");
    }
  };

  const filtered = documents.filter(d => 
    (cat === "Semua" || d.tipe === cat) &&
    (!search || d.nama.toLowerCase().includes(search.toLowerCase()) || d.pasien.toLowerCase().includes(search.toLowerCase()))
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
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>Modul Dokumen Medis & Surat Keterangan</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "2px 0 0" }}>Buat dan cetak Surat Keterangan Sakit, Surat Rujukan RS, dan Surat Sehat</p>
        </div>

        <button onClick={() => setShowCreateModal(true)} style={{ display: "flex", alignItems: "center", gap: 8, background: "#0d9488", color: "#fff", border: "none", borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(13,148,136,0.25)" }}>
          <Plus style={{ width: 16, height: 16 }} /> Buat Dokumen Baru
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        {[
          { label: "Total Dokumen Terbit", val: documents.length, color: "#0d9488", bg: "#e0f2fe" },
          { label: "Surat Sakit", val: documents.filter(d => d.tipe === "Surat Sakit").length, color: "#8b5cf6", bg: "#ede9fe" },
          { label: "Surat Rujukan", val: documents.filter(d => d.tipe === "Surat Rujukan").length, color: "#f97316", bg: "#fff7ed" },
          { label: "Surat Keterangan Sehat", val: documents.filter(d => d.tipe === "Surat Sehat").length, color: "#22c55e", bg: "#f0fdf4" },
        ].map((s, i) => (
          <Container key={i} style={{ padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FileText style={{ width: 20, height: 20, color: s.color }} />
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
              placeholder="Cari nama dokumen atau pasien..."
              style={{ width: "100%", paddingLeft: 34, paddingRight: 16, paddingTop: 8.5, paddingBottom: 8.5, borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8fafc", fontSize: 12.5, outline: "none" }} 
            />
          </div>

          {["Semua", "Surat Sakit", "Surat Rujukan", "Surat Sehat", "Hasil Lab"].map(c => (
            <button 
              key={c} 
              onClick={() => setCat(c)} 
              style={{ 
                padding: "7px 14px", borderRadius: 10, border: "1.5px solid", fontSize: 12, fontWeight: 600, cursor: "pointer",
                borderColor: cat === c ? "#0d9488" : "#e2e8f0", background: cat === c ? "#0d9488" : "#fff", color: cat === c ? "#fff" : "#64748b" 
              }}>
              {c}
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
                {["Nama Dokumen", "Jenis Dokumen", "Pasien", "Dokter Penanggung Jawab", "Tanggal", "Aksi"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#64748b", borderBottom: "1px solid #e8f0fe" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 36, color: "#94a3b8" }}>
                    Tidak ada dokumen ditemukan.
                  </td>
                </tr>
              ) : (
                filtered.map((d) => (
                  <tr key={d.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: `${d.color}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ fontSize: 9, fontWeight: 900, color: d.color }}>PDF</span>
                        </div>
                        <span style={{ fontWeight: 800, color: "#0f172a" }}>{d.nama}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: `${d.color}18`, color: d.color, borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 800 }}>{d.tipe}</span>
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#334155" }}>{d.pasien}</td>
                    <td style={{ padding: "12px 16px", color: "#64748b" }}>{d.dokter}</td>
                    <td style={{ padding: "12px 16px", color: "#64748b" }}>{d.tgl}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => setViewDoc(d)} style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", fontSize: 11, fontWeight: 700, color: "#334155", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                          <Eye style={{ width: 12, height: 12 }} /> Lihat
                        </button>
                        <button onClick={() => setViewDoc(d)} style={{ padding: "5px 10px", borderRadius: 8, border: "none", background: "#0d9488", fontSize: 11, fontWeight: 700, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                          <Printer style={{ width: 12, height: 12 }} /> Cetak
                        </button>
                        <button onClick={() => handleDelete(d.id)} style={{ padding: "5px 8px", borderRadius: 8, border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", cursor: "pointer" }}>
                          <Trash2 style={{ width: 12, height: 12 }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Container>

      {/* CREATE DOCUMENT MODAL */}
      {showCreateModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <Container style={{ width: 460, padding: 26 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>Buat Dokumen Surat Keterangan</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ border: "none", background: "#f1f5f9", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>✕</button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Jenis Dokumen Medis</label>
                <select 
                  value={docForm.tipe} 
                  onChange={e => setDocForm({ ...docForm, tipe: e.target.value as any })}
                  style={{ width: "100%", padding: "9.5px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none", fontWeight: 700 }}>
                  <option value="Surat Sakit">Surat Keterangan Sakit</option>
                  <option value="Surat Rujukan">Surat Rujukan RS</option>
                  <option value="Surat Sehat">Surat Keterangan Sehat</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Nama Pasien *</label>
                <input 
                  type="text" required value={docForm.pasien} 
                  onChange={e => setDocForm({ ...docForm, pasien: e.target.value })}
                  placeholder="Ketik nama pasien..."
                  style={{ width: "100%", padding: "9.5px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none" }} 
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Dokter Penanggung Jawab</label>
                <select 
                  value={docForm.dokter} 
                  onChange={e => setDocForm({ ...docForm, dokter: e.target.value })}
                  style={{ width: "100%", padding: "9.5px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none" }}>
                  {doctorsList.map(d => <option key={d.id || d.name} value={d.name}>{d.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Isi Keterangan / Instruksi</label>
                <textarea 
                  rows={3} 
                  value={docForm.detailInfo} 
                  onChange={e => setDocForm({ ...docForm, detailInfo: e.target.value })}
                  style={{ width: "100%", padding: "9.5px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none" }} 
                />
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 700, color: "#64748b" }}>Batal</button>
                <button type="submit" style={{ flex: 2, padding: "10px 0", borderRadius: 10, border: "none", background: "#0d9488", color: "#fff", fontSize: 13, fontWeight: 800 }}>Terbitkan Dokumen</button>
              </div>
            </form>
          </Container>
        </div>
      )}

      {/* DOCUMENT PRINT PREVIEW MODAL */}
      {viewDoc && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <Container style={{ width: 480, padding: 28, background: "#fff" }}>
            <div style={{ borderBottom: "2px stroke #0f172a", paddingBottom: 14, marginBottom: 16, textAlign: "center" }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: "#0f172a", margin: 0 }}>Klinik Sehat Sentosa</h3>
              <p style={{ fontSize: 10, color: "#64748b", margin: "2px 0 0" }}>Jl. Pemuda No. 45 Semarang • Telp: (024) 8899-7766</p>
              <h4 style={{ fontSize: 14, fontWeight: 900, color: viewDoc.color || "#0d9488", margin: "12px 0 0", textTransform: "uppercase" }}>{viewDoc.tipe}</h4>
            </div>

            <div style={{ fontSize: 12.5, color: "#334155", lineHeight: 1.6, marginBottom: 20 }}>
              <p style={{ margin: "0 0 10px" }}>Yang bertanda tangan di bawah ini menerangkan bahwa:</p>
              <div style={{ background: "#f8fafc", padding: 12, borderRadius: 10, marginBottom: 12 }}>
                <div><strong>Nama Pasien:</strong> {viewDoc.pasien}</div>
                <div><strong>Tanggal Terbit:</strong> {viewDoc.tgl}</div>
              </div>
              <p style={{ margin: "0 0 12px" }}><strong>Keterangan Medis:</strong> {viewDoc.detailInfo || "Dinyatakan dalam kondisi sehat."}</p>
              <p style={{ margin: 0, textAlign: "right", marginTop: 24 }}>
                Semarang, {viewDoc.tgl}<br />
                <strong>Dokter Pemeriksa:</strong><br /><br /><br />
                <u>({viewDoc.dokter})</u>
              </p>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setViewDoc(null)} style={{ flex: 1, padding: "9.5px 0", borderRadius: 10, border: "1.5px solid #cbd5e1", background: "#fff", fontSize: 12, fontWeight: 700 }}>Tutup</button>
              <button onClick={() => window.print()} style={{ flex: 2, padding: "9.5px 0", borderRadius: 10, border: "none", background: "#0d9488", color: "#fff", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Printer style={{ width: 14, height: 14 }} /> Cetak PDF / Printer
              </button>
            </div>
          </Container>
        </div>
      )}
    </div>
  );
}
