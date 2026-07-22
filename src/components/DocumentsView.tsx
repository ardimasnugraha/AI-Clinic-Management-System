"use client";

import React, { useState, useEffect } from "react";
import { FileText, Plus, Search, Download, Eye, Trash2, Printer, CheckCircle2, Check } from "lucide-react";
import { logAuditEvent, getStoredDoctors } from "@/lib/store";
import { supabase } from "@/lib/supabase/client";

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

  const loadDocuments = async () => {
    // Load Patients & Doctors
    try {
      const { data: pData } = await supabase.from("patients").select("*").order("full_name", { ascending: true });
      if (pData) {
        setRegisteredPatients(pData.map((p: any) => ({ rm: p.medical_record_number, name: p.full_name })));
      } else {
        const p = localStorage.getItem("clinic_patients_v1");
        if (p) setRegisteredPatients(JSON.parse(p));
      }
    } catch (e) {}

    try {
      const { data: dData } = await supabase.from("doctor_profiles").select("*");
      if (dData && dData.length > 0) {
        setDoctorsList(dData.map((d: any) => ({ name: d.full_name, poli: d.poli })));
      } else {
        setDoctorsList(getStoredDoctors());
      }
    } catch (e) {
      setDoctorsList(getStoredDoctors());
    }

    // Load Documents from Supabase
    try {
      const { data, error } = await supabase
        .from("clinic_documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        const typeColors: Record<string, string> = {
          "Surat Sakit": "#0d9488",
          "Surat Rujukan": "#8b5cf6",
          "Surat Sehat": "#22c55e",
          "Hasil Lab": "#3b82f6",
          "Rekam Medis": "#f97316"
        };
        const mapped: ClinicDocument[] = data.map((d: any) => ({
          id: d.doc_no || d.id,
          nama: d.nama,
          tipe: d.tipe as any,
          ukuran: d.ukuran || "200 KB",
          tgl: d.tgl || new Date().toISOString().split("T")[0],
          pasien: d.pasien,
          dokter: d.dokter,
          detailInfo: d.detail_info,
          color: typeColors[d.tipe] || "#0d9488",
          ext: d.ext || "PDF"
        }));
        setDocuments(mapped);
        localStorage.setItem("clinic_documents_v1", JSON.stringify(mapped));
      } else {
        const cached = localStorage.getItem("clinic_documents_v1");
        if (cached) setDocuments(JSON.parse(cached));
      }
    } catch (e) {
      console.warn("Error fetching documents from Supabase", e);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
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

    const docId = `DOC${String(documents.length + 1).padStart(3, '0')}`;
    const docName = `${docForm.tipe} - ${docForm.pasien}`;
    const todayStr = new Date().toISOString().split("T")[0];

    const newDoc: ClinicDocument = {
      id: docId,
      nama: docName,
      tipe: docForm.tipe,
      ukuran: "210 KB",
      tgl: todayStr,
      pasien: docForm.pasien,
      dokter: docForm.dokter,
      detailInfo: docForm.detailInfo,
      color: typeColors[docForm.tipe] || "#0d9488",
      ext: "PDF"
    };

    // Save to Supabase
    try {
      await supabase.from("clinic_documents").insert([{
        clinic_id: "11111111-1111-1111-1111-111111111111",
        doc_no: docId,
        nama: docName,
        tipe: docForm.tipe,
        ukuran: "210 KB",
        tgl: todayStr,
        pasien: docForm.pasien,
        dokter: docForm.dokter,
        detail_info: docForm.detailInfo,
        color: typeColors[docForm.tipe] || "#0d9488",
        ext: "PDF"
      }]);
    } catch (e) {
      console.warn("Failed saving document to Supabase", e);
    }

    const updated = [newDoc, ...documents];
    setDocuments(updated);
    try { localStorage.setItem("clinic_documents_v1", JSON.stringify(updated)); } catch (e) {}

    setShowCreateModal(false);
    showToast(`Berhasil menerbitkan ${docForm.tipe} untuk ${docForm.pasien}`);
    logAuditEvent("Terbitkan Dokumen", "Dokumen", `Menerbitkan ${docForm.tipe} untuk ${docForm.pasien}`);
  };

  const handleDeleteDoc = async (id: string) => {
    if (!confirm("Yakin menghapus dokumen ini?")) return;
    const updated = documents.filter(d => d.id !== id);
    setDocuments(updated);
    try { localStorage.setItem("clinic_documents_v1", JSON.stringify(updated)); } catch (e) {}

    try {
      await supabase.from("clinic_documents").delete().or(`doc_no.eq.${id},id.eq.${id}`);
    } catch (e) {}

    showToast("Dokumen berhasil dihapus.");
    logAuditEvent("Hapus Dokumen", "Dokumen", `Menghapus dokumen ID ${id}`);
  };

  const filtered = documents.filter(d => {
    const matchCat = cat === "Semua" || d.tipe === cat;
    const matchSearch = !search || d.nama.toLowerCase().includes(search.toLowerCase()) || d.pasien.toLowerCase().includes(search.toLowerCase()) || d.dokter.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

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
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>Modul Dokumen & Surat Klinik</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "2px 0 0" }}>Terbitkan Surat Sakit, Surat Rujukan, Surat Sehat, & dokumen medis pasien secara resmi</p>
        </div>

        <button 
          onClick={() => setShowCreateModal(true)}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "#0d9488", color: "#fff", border: "none", borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(13,148,136,0.25)" }}>
          <Plus style={{ width: 16, height: 16 }} /> Terbitkan Surat / Dokumen
        </button>
      </div>

      {/* Filter Bar */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["Semua", "Surat Sakit", "Surat Rujukan", "Surat Sehat", "Hasil Lab", "Rekam Medis"].map(c => (
            <button 
              key={c}
              onClick={() => setCat(c)}
              style={{
                padding: "8px 16px", borderRadius: 20, border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer",
                background: cat === c ? "#0d9488" : "#f1f5f9", color: cat === c ? "#fff" : "#64748b"
              }}>
              {c}
            </button>
          ))}
        </div>

        <div style={{ position: "relative", width: 260 }}>
          <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "#94a3b8" }} />
          <input 
            type="text" 
            placeholder="Cari dokumen, pasien, dokter..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "8px 14px 8px 36px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 12.5 }}
          />
        </div>
      </div>

      {/* Document Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {filtered.length === 0 ? (
          <Container style={{ gridColumn: "1 / -1", padding: 40, textAlign: "center", color: "#94a3b8" }}>
            <FileText style={{ width: 40, height: 40, margin: "0 auto 10px", opacity: 0.4 }} />
            <p style={{ margin: 0, fontWeight: 600 }}>Belum ada dokumen yang diterbitkan.</p>
          </Container>
        ) : (
          filtered.map(doc => (
            <Container key={doc.id} style={{ padding: 18, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ background: `${doc.color}15`, color: doc.color, padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 800 }}>
                    {doc.tipe}
                  </span>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>{doc.tgl}</span>
                </div>

                <h4 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: "0 0 6px", lineHeight: 1.3 }}>{doc.nama}</h4>
                <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 12px" }}>Dokter: <strong>{doc.dokter}</strong></p>
                {doc.detailInfo && (
                  <p style={{ fontSize: 11.5, color: "#475569", background: "#f8fafc", padding: 8, borderRadius: 8, margin: "0 0 12px", borderLeft: `3px solid ${doc.color}` }}>
                    {doc.detailInfo}
                  </p>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid #f1f5f9" }}>
                <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>{doc.ukuran} • {doc.ext}</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => setViewDoc(doc)} title="Lihat Pratinjau" style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: 6, cursor: "pointer", color: "#475569" }}>
                    <Eye style={{ width: 14, height: 14 }} />
                  </button>
                  <button onClick={() => handleDeleteDoc(doc.id)} title="Hapus Dokumen" style={{ background: "#fef2f2", border: "none", borderRadius: 8, padding: 6, cursor: "pointer", color: "#ef4444" }}>
                    <Trash2 style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              </div>
            </Container>
          ))
        )}
      </div>

      {/* Modal Terbitkan Dokumen */}
      {showCreateModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 500, padding: 24, boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "0 0 16px" }}>Terbitkan Dokumen / Surat Medis</h3>

            <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Jenis Surat / Dokumen *</label>
                <select 
                  value={docForm.tipe} 
                  onChange={e => setDocForm({ ...docForm, tipe: e.target.value as any })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 13, background: "#fff" }}>
                  <option value="Surat Sakit">Surat Keterangan Sakit</option>
                  <option value="Surat Rujukan">Surat Rujukan Rumah Sakit</option>
                  <option value="Surat Sehat">Surat Keterangan Sehat</option>
                  <option value="Hasil Lab">Hasil Pemeriksaan Laboratorium</option>
                  <option value="Rekam Medis">Ringkasan Rekam Medis Pasien</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Pilih Nama Pasien *</label>
                {registeredPatients.length > 0 ? (
                  <select 
                    required
                    value={docForm.pasien} 
                    onChange={e => setDocForm({ ...docForm, pasien: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 13, background: "#fff" }}>
                    <option value="">-- Pilih Pasien Terdaftar --</option>
                    {registeredPatients.map((p, idx) => (
                      <option key={idx} value={p.name}>{p.name} ({p.rm})</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    required
                    placeholder="Nama Lengkap Pasien"
                    value={docForm.pasien} 
                    onChange={e => setDocForm({ ...docForm, pasien: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 13 }} 
                  />
                )}
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Dokter Penanggung Jawab</label>
                <select 
                  value={docForm.dokter} 
                  onChange={e => setDocForm({ ...docForm, dokter: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 13, background: "#fff" }}>
                  {doctorsList.length > 0 ? (
                    doctorsList.map((d, idx) => (
                      <option key={idx} value={d.name}>{d.name} ({d.poli})</option>
                    ))
                  ) : (
                    <option value="dr. Maya Lestari">dr. Maya Lestari (Poli Umum)</option>
                  )}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Keterangan / Isi Dokumen</label>
                <textarea 
                  rows={3}
                  value={docForm.detailInfo}
                  onChange={e => setDocForm({ ...docForm, detailInfo: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 13, fontFamily: "inherit" }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 10 }}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontWeight: 700, cursor: "pointer" }}>
                  Batal
                </button>
                <button type="submit" style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "#0d9488", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
                  Terbitkan Surat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Preview Dokumen */}
      {viewDoc && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 520, padding: 28, boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>
            <div style={{ borderBottom: `4px solid ${viewDoc.color}`, paddingBottom: 14, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: viewDoc.color, textTransform: "uppercase" }}>KLINIK SEHAT SENTOSA</div>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: "#0f172a", margin: "4px 0 0" }}>{viewDoc.nama}</h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13, color: "#334155" }}>
              <div><strong>Nomor Dokumen:</strong> {viewDoc.id}</div>
              <div><strong>Tanggal Terbit:</strong> {viewDoc.tgl}</div>
              <div><strong>Nama Pasien:</strong> {viewDoc.pasien}</div>
              <div><strong>Dokter Pemeriksa:</strong> {viewDoc.dokter}</div>
              <div style={{ background: "#f8fafc", padding: 12, borderRadius: 10, marginTop: 8, border: "1px solid #e2e8f0" }}>
                <strong>Keterangan Medis:</strong>
                <p style={{ margin: "4px 0 0", color: "#475569" }}>{viewDoc.detailInfo || "Diberikan secara sah oleh klinik."}</p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
              <button onClick={() => setViewDoc(null)} style={{ padding: "9px 18px", borderRadius: 10, border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontWeight: 700, cursor: "pointer" }}>
                Tutup
              </button>
              <button onClick={() => alert("Mencetak dokumen medis PDF...")} style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: viewDoc.color, color: "#fff", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <Printer style={{ width: 14, height: 14 }} /> Cetak Dokumen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
