"use client";

import React, { useState, useEffect } from "react";
import { FileText, Plus, Search, Eye, Trash2, Printer, CheckCircle2, UserCheck, ShieldCheck } from "lucide-react";
import { logAuditEvent, getStoredDoctors } from "@/lib/store";
import { supabase } from "@/lib/supabase/client";

const Container = ({ style, ...p }: any) => (
  <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e8f0fe", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", ...style }} {...p} />
);

export interface RegisteredPatientItem {
  rm: string;
  name: string;
  gender?: string;
  age?: number;
  phone?: string;
}

export interface ClinicDocument {
  id: string;
  docNo: string;
  nama: string;
  tipe: "Surat Sakit" | "Surat Rujukan" | "Surat Sehat" | "Hasil Lab" | "Rekam Medis";
  ukuran: string;
  tgl: string;
  pasien: string;
  pasienRm?: string;
  pasienAge?: number | string;
  pasienGender?: string;
  dokter: string;
  dokterSip?: string;
  detailInfo?: string;
  color: string;
  ext: string;
}

const DEFAULT_REGISTERED_PATIENTS: RegisteredPatientItem[] = [];

export default function DocumentsView() {
  const [documents, setDocuments] = useState<ClinicDocument[]>([]);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("Semua");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewDoc, setViewDoc] = useState<ClinicDocument | null>(null);
  const [registeredPatients, setRegisteredPatients] = useState<RegisteredPatientItem[]>(DEFAULT_REGISTERED_PATIENTS);
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isManualPatient, setIsManualPatient] = useState(false);

  // Form State
  const [docForm, setDocForm] = useState({
    tipe: "Surat Sakit" as ClinicDocument["tipe"],
    pasien: "",
    pasienRm: "",
    pasienAge: 0,
    pasienGender: "Laki-laki",
    dokter: "dr. Maya Lestari",
    dokterSip: "SIP-2024-001",
    detailInfo: "Diberikan istirahat berobat / istirahat sakit selama 3 hari karena kondisi kesehatan."
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadDocuments = async () => {
    // Load Registered Patients
    try {
      const { data: pData } = await supabase.from("patients").select("*").order("full_name", { ascending: true });
      if (pData && pData.length > 0) {
        setRegisteredPatients(pData.map((p: any) => ({
          rm: p.medical_record_number || "RM000123",
          name: p.full_name,
          gender: p.gender || "Laki-laki",
          age: p.date_of_birth ? Math.floor((new Date().getTime() - new Date(p.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 30,
          phone: p.phone_number
        })));
      } else {
        const p = localStorage.getItem("clinic_patients_v1");
        if (p) {
          try {
            const parsed = JSON.parse(p);
            if (Array.isArray(parsed) && parsed.length > 0) setRegisteredPatients(parsed);
          } catch (e) {}
        }
      }
    } catch (e) {}

    // Load Doctors
    try {
      const { data: dData } = await supabase.from("doctor_profiles").select("*");
      if (dData && dData.length > 0) {
        setDoctorsList(dData.map((d: any) => ({ name: d.full_name, poli: d.poli, sip: d.sip || "SIP-2024-001" })));
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
          docNo: d.doc_no || `DOC${String(d.id).padStart(3, '0')}`,
          nama: d.nama,
          tipe: d.tipe as any,
          ukuran: d.ukuran || "210 KB",
          tgl: d.tgl || new Date().toISOString().split("T")[0],
          pasien: d.pasien,
          pasienRm: d.pasien_rm || "RM000123",
          pasienAge: d.pasien_age || 32,
          pasienGender: d.pasien_gender || "Laki-laki",
          dokter: d.dokter,
          dokterSip: d.dokter_sip || "SIP-2024-001",
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

  // When Type Changes, Auto pre-fill realistic doctor notes
  const handleTypeChange = (newType: ClinicDocument["tipe"]) => {
    let note = "";
    if (newType === "Surat Sakit") {
      note = "Diberikan istirahat berobat / istirahat sakit selama 3 (tiga) hari terhitung sejak tanggal " + new Date().toLocaleDateString("id-ID") + " karena kondisi kesehatan.";
    } else if (newType === "Surat Sehat") {
      note = "Berdasarkan hasil pemeriksaan fisik dan vital sign hari ini, pasien dinyatakan dalam keadaan SEHAT FISIK & MENTAL dan tidak memiliki tanda-tanda penyakit menular.";
    } else if (newType === "Surat Rujukan") {
      note = "Mohon pemeriksaan dan penanganan spesialis lebih lanjut untuk pasien tersebut dengan dugaan diagnosis kerja. Pasien telah diberikan terapi pertolongan pertama.";
    } else if (newType === "Hasil Lab") {
      note = "Pemeriksaan Laboratorium Klinik: Darah Lengkap (Hb 14.2 g/dL, Leukosit 7.500/uL), Gula Darah Puasa 98 mg/dL. Seluruh parameter berada pada batas normal.";
    } else {
      note = "Ringkasan Rekam Medis: Pasien memiliki riwayat pemeriksaan rutin Poli Klinik dengan respon terapi sangat baik.";
    }
    setDocForm(prev => ({ ...prev, tipe: newType, detailInfo: note }));
  };

  // Handle Selecting Registered Patient
  const handleSelectPatient = (patientName: string) => {
    const found = registeredPatients.find(p => p.name === patientName);
    if (found) {
      setDocForm(prev => ({
        ...prev,
        pasien: found.name,
        pasienRm: found.rm,
        pasienAge: found.age || 30,
        pasienGender: found.gender || "Laki-laki"
      }));
    } else {
      setDocForm(prev => ({ ...prev, pasien: patientName }));
    }
  };

  // Handle Selecting Doctor
  const handleSelectDoctor = (doctorName: string) => {
    const found = doctorsList.find(d => d.name === doctorName);
    setDocForm(prev => ({
      ...prev,
      dokter: doctorName,
      dokterSip: found?.sip || "SIP-2024-001"
    }));
  };

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
      docNo: docId,
      nama: docName,
      tipe: docForm.tipe,
      ukuran: "210 KB",
      tgl: todayStr,
      pasien: docForm.pasien,
      pasienRm: docForm.pasienRm || "RM000123",
      pasienAge: docForm.pasienAge || 32,
      pasienGender: docForm.pasienGender || "Laki-laki",
      dokter: docForm.dokter,
      dokterSip: docForm.dokterSip || "SIP-2024-001",
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
      {/* CSS untuk Cetak Surat Medis PDF */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #printable-doctor-letter, #printable-doctor-letter * { visibility: visible !important; }
          #printable-doctor-letter {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 30px !important;
            background: #fff !important;
            color: #000 !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

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
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>Modul Dokumen & Surat Klinik</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "2px 0 0" }}>Terbitkan Surat Sakit, Surat Rujukan, Surat Sehat, & dokumen medis pasien secara resmi</p>
        </div>

        <button 
          onClick={() => setShowCreateModal(true)}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "#0d9488", color: "#fff", border: "none", borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(13,148,136,0.25)" }}>
          <Plus style={{ width: 16, height: 16 }} /> Terbitkan Surat / Dokumen
        </button>
      </div>

      {/* Filter Category & Search */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["Semua", "Surat Sakit", "Surat Rujukan", "Surat Sehat", "Hasil Lab", "Rekam Medis"].map(c => (
            <button 
              key={c}
              onClick={() => setCat(c)}
              style={{ 
                padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer",
                background: cat === c ? "#0d9488" : "#f1f5f9", color: cat === c ? "#fff" : "#475569"
              }}>
              {c}
            </button>
          ))}
        </div>

        <div style={{ position: "relative" }}>
          <Search style={{ width: 14, height: 14, color: "#94a3b8", position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
          <input 
            type="text" 
            placeholder="Cari dokumen, pasien, dokter..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: "8px 12px 8px 30px", borderRadius: 10, border: "1.5px solid #cbd5e1", fontSize: 12, outline: "none", width: 220 }}
          />
        </div>
      </div>

      {/* Table Documents */}
      <Container style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["No. Dokumen", "Nama Surat / Dokumen", "Nama Pasien", "Dokter Penulis", "Tanggal Terbit", "Tipe", "Aksi"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#64748b", borderBottom: "1px solid #e8f0fe" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 36, color: "#94a3b8" }}>
                    Tidak ada dokumen medis yang sesuai dengan pencarian.
                  </td>
                </tr>
              ) : (
                filtered.map((d) => (
                  <tr key={d.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <td style={{ padding: "12px 16px", color: "#0d9488", fontWeight: 800 }}>{d.id}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
                        <FileText style={{ width: 14, height: 14, color: d.color }} />
                        <span>{d.nama}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#334155" }}>{d.pasien}</td>
                    <td style={{ padding: "12px 16px", color: "#475569" }}>{d.dokter}</td>
                    <td style={{ padding: "12px 16px", color: "#64748b" }}>{d.tgl}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ 
                        background: d.color + "18", color: d.color, border: `1px solid ${d.color}35`,
                        borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 800 
                      }}>
                        {d.tipe}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button 
                          onClick={() => setViewDoc(d)}
                          title="Lihat / Cetak Surat Dokter Resmi"
                          style={{ padding: "5px 10px", borderRadius: 8, border: "none", background: "#e0f2fe", color: "#0369a1", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                          <Eye style={{ width: 12, height: 12 }} /> Lihat / Cetak Surat
                        </button>
                        <button 
                          onClick={() => handleDeleteDoc(d.id)}
                          title="Hapus Dokumen"
                          style={{ padding: "5px 8px", borderRadius: 8, border: "none", background: "#fef2f2", color: "#dc2626", fontSize: 11, cursor: "pointer" }}>
                          <Trash2 style={{ width: 13, height: 13 }} />
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

      {/* Modal Terbitkan Dokumen */}
      {showCreateModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 520, padding: 24, boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "0 0 16px" }}>Terbitkan Dokumen / Surat Medis Resmi</h3>

            <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Jenis Surat / Dokumen *</label>
                <select 
                  value={docForm.tipe} 
                  onChange={e => handleTypeChange(e.target.value as any)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #0d9488", fontSize: 13, background: "#fff", fontWeight: 800, color: "#0d9488" }}>
                  <option value="Surat Sakit">Surat Keterangan Sakit</option>
                  <option value="Surat Rujukan">Surat Rujukan Rumah Sakit</option>
                  <option value="Surat Sehat">Surat Keterangan Sehat</option>
                  <option value="Hasil Lab">Hasil Pemeriksaan Laboratorium</option>
                  <option value="Rekam Medis">Ringkasan Rekam Medis Pasien</option>
                </select>
              </div>

              {/* Mode Input Pasien: Pilih Dari Daftar atau Ketik Baru */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>Pilih Nama Pasien *</label>
                  <button 
                    type="button" 
                    onClick={() => setIsManualPatient(!isManualPatient)}
                    style={{ fontSize: 11, color: "#0d9488", background: "none", border: "none", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>
                    {isManualPatient ? "← Pilih Pasien Terdaftar" : "+ Ketik Nama Pasien Manual"}
                  </button>
                </div>

                {!isManualPatient ? (
                  <select 
                    required
                    value={docForm.pasien} 
                    onChange={e => handleSelectPatient(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 13, background: "#fff", fontWeight: 700, color: "#0f172a" }}>
                    <option value="">-- Pilih Pasien Terdaftar --</option>
                    {registeredPatients.map((p, idx) => (
                      <option key={idx} value={p.name}>{p.name} ({p.rm})</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    required
                    placeholder="Masukkan nama lengkap pasien..."
                    value={docForm.pasien} 
                    onChange={e => setDocForm({ ...docForm, pasien: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 13 }} 
                  />
                )}
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Dokter Penanggung Jawab *</label>
                <select 
                  value={docForm.dokter} 
                  onChange={e => handleSelectDoctor(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 13, background: "#fff", fontWeight: 700, color: "#0f172a" }}>
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
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Keterangan Medis & Diagnosa *</label>
                <textarea 
                  rows={3}
                  required
                  value={docForm.detailInfo}
                  onChange={e => setDocForm({ ...docForm, detailInfo: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 12.5, fontFamily: "inherit" }}
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

      {/* Modal Preview & Cetak Surat Dokter Resmi (Dunia Nyata) */}
      {viewDoc && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, overflowY: "auto" }}>
          <div id="printable-doctor-letter" style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 650, padding: "36px 44px", boxShadow: "0 25px 50px rgba(0,0,0,0.3)", position: "relative", color: "#0f172a", fontFamily: "Georgia, serif" }}>
            
            {/* 1. KOP SURAT RESMI KLINIK */}
            <div style={{ textAlign: "center", borderBottom: "3px double #0f172a", paddingBottom: 14, marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 4 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "#0d9488", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 20, fontFamily: "sans-serif" }}>
                  +
                </div>
                <div>
                  <h2 style={{ fontSize: 21, fontWeight: 900, color: "#0f172a", margin: 0, textTransform: "uppercase", letterSpacing: 1 }}>KLINIK SEHAT SENTOSA</h2>
                  <p style={{ fontSize: 11, color: "#475569", margin: "2px 0 0", fontFamily: "sans-serif" }}>Pelayanan Kesehatan Utama & Spesialis Terpadu</p>
                </div>
              </div>
              <p style={{ fontSize: 11, color: "#475569", margin: 0, fontFamily: "sans-serif" }}>
                Jl. Pemuda No. 123, Semarang, Jawa Tengah • Telp: (024) 8412345 • Email: kontak@klinikai.co.id
              </p>
              <p style={{ fontSize: 10, color: "#64748b", margin: "2px 0 0", fontStyle: "italic", fontFamily: "sans-serif" }}>
                Izin Operasional Kemenkes RI No: 503/412/DINKES/2024
              </p>
            </div>

            {/* 2. JUDUL SURAT & NOMOR REGISTRASI */}
            <div style={{ textAlign: "center", marginBottom: 22 }}>
              <h3 style={{ fontSize: 15, fontWeight: 900, color: "#0f172a", margin: 0, textDecoration: "underline", textTransform: "uppercase", letterSpacing: 1 }}>
                {viewDoc.tipe === "Surat Sakit" ? "SURAT KETERANGAN SAKIT" : viewDoc.tipe === "Surat Sehat" ? "SURAT KETERANGAN SEHAT" : viewDoc.tipe === "Surat Rujukan" ? "SURAT RUJUKAN MEDIS" : viewDoc.tipe === "Hasil Lab" ? "HASIL PEMERIKSAAN LABORATORIUM" : "RINGKASAN REKAM MEDIS PASIEN"}
              </h3>
              <p style={{ fontSize: 11.5, color: "#475569", margin: "4px 0 0", fontFamily: "sans-serif", fontWeight: 600 }}>
                Nomor: 440 / SKD-KSS / {new Date().getFullYear()} / {viewDoc.id}
              </p>
            </div>

            {/* 3. KALIMAT PEMBUKA */}
            <p style={{ fontSize: 13, lineHeight: 1.7, margin: "0 0 14px" }}>
              Yang bertanda tangan di bawah ini, Dokter Pemeriksa pada Klinik Sehat Sentosa Semarang, menerangkan dengan sebenarnya bahwa:
            </p>

            {/* 4. TABEL BIODATA PASIEN */}
            <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", marginBottom: 18 }}>
              <tbody>
                <tr>
                  <td style={{ width: 170, padding: "4px 0", fontWeight: 700 }}>Nama Pasien</td>
                  <td style={{ width: 15 }}>:</td>
                  <td style={{ padding: "4px 0", fontWeight: 800, color: "#0d9488" }}>{viewDoc.pasien}</td>
                </tr>
                <tr>
                  <td style={{ padding: "4px 0", fontWeight: 700 }}>No. Rekam Medis (RM)</td>
                  <td>:</td>
                  <td style={{ padding: "4px 0", fontFamily: "monospace", fontWeight: 700 }}>{viewDoc.pasienRm || "RM000123"}</td>
                </tr>
                <tr>
                  <td style={{ padding: "4px 0", fontWeight: 700 }}>Umur / Tanggal Lahir</td>
                  <td>:</td>
                  <td style={{ padding: "4px 0" }}>{viewDoc.pasienAge ? `${viewDoc.pasienAge} Tahun` : "32 Tahun"}</td>
                </tr>
                <tr>
                  <td style={{ padding: "4px 0", fontWeight: 700 }}>Jenis Kelamin</td>
                  <td>:</td>
                  <td style={{ padding: "4px 0" }}>{viewDoc.pasienGender || "Laki-laki"}</td>
                </tr>
                <tr>
                  <td style={{ padding: "4px 0", fontWeight: 700 }}>Alamat / Domisili</td>
                  <td>:</td>
                  <td style={{ padding: "4px 0" }}>Semarang, Jawa Tengah</td>
                </tr>
              </tbody>
            </table>

            {/* 5. ISI PERNYATAAN MEDIS */}
            <div style={{ background: "#f8fafc", borderLeft: `4px solid ${viewDoc.color}`, padding: "14px 18px", borderRadius: 8, marginBottom: 20, fontSize: 13, lineHeight: 1.7 }}>
              <strong>Keterangan Diagnosa & Anjuran Medis:</strong>
              <p style={{ margin: "6px 0 0", color: "#1e293b", whiteSpace: "pre-line" }}>
                {viewDoc.detailInfo || "Pasien tersebut dalam keadaan kurang sehat dan memerlukan istirahat berobat."}
              </p>
            </div>

            <p style={{ fontSize: 13, lineHeight: 1.7, margin: "0 0 28px" }}>
              Demikian surat keterangan medis ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.
            </p>

            {/* 6. STEMPEL & TANDA TANGAN DOKTER */}
            <div style={{ display: "flex", justifyContent: "flex-end", textAlign: "center", position: "relative" }}>
              <div style={{ width: 220, position: "relative" }}>
                <p style={{ fontSize: 12, margin: 0, fontFamily: "sans-serif" }}>Semarang, {viewDoc.tgl}</p>
                <p style={{ fontSize: 12, fontWeight: 700, margin: "2px 0 45px", fontFamily: "sans-serif" }}>Dokter Penanggung Jawab,</p>
                
                {/* Cap Stempel Digital Klinik */}
                <div style={{ position: "absolute", top: 22, left: 10, width: 85, height: 85, border: "3px double #0d9488", borderRadius: "50%", opacity: 0.35, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transform: "rotate(-12deg)", color: "#0d9488", pointerEvents: "none" }}>
                  <span style={{ fontSize: 6.5, fontWeight: 900, textTransform: "uppercase" }}>KLINIK SEHAT SENTOSA</span>
                  <span style={{ fontSize: 8.5, fontWeight: 900 }}>★ SEMARANG ★</span>
                  <span style={{ fontSize: 6 }}>RESI DOKTER</span>
                </div>

                <p style={{ fontSize: 13, fontWeight: 900, margin: 0, textDecoration: "underline", color: "#0f172a" }}>
                  {viewDoc.dokter}
                </p>
                <p style={{ fontSize: 11, color: "#64748b", margin: "2px 0 0", fontFamily: "sans-serif" }}>
                  {viewDoc.dokterSip || "SIP: SIP-2024-001"}
                </p>
              </div>
            </div>

            {/* BUTTONS (Non-printable) */}
            <div className="no-print" style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 28, borderTop: "1px solid #e2e8f0", paddingTop: 16 }}>
              <button type="button" onClick={() => setViewDoc(null)} style={{ padding: "9px 18px", borderRadius: 10, border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontWeight: 700, cursor: "pointer", fontFamily: "sans-serif" }}>
                Tutup
              </button>
              <button type="button" onClick={() => window.print()} style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: "#0d9488", color: "#fff", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "sans-serif", boxShadow: "0 4px 12px rgba(13,148,136,0.25)" }}>
                <Printer style={{ width: 15, height: 15 }} /> Cetak Surat Resmi (PDF)
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
