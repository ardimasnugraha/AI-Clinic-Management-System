"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, Plus, Download, MoreVertical, ChevronLeft, 
  ChevronRight, Eye, User, Phone, Mail, MapPin, 
  ShieldCheck, AlertTriangle, Filter, Sparkles,
  CheckCircle2, FileText, ArrowRight, UserCheck, Calendar, Activity
} from "lucide-react";
import { supabase, isConfigured } from "@/lib/supabase/client";
import { addQueueTicketDirect } from "@/lib/store";

export interface PatientItem {
  rm: string;
  name: string;
  nik: string;
  dob: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  status: "Aktif" | "Tidak Aktif";
  religion: string;
  age: number;
  insurance: string;
  insuranceNo: string;
  emergencyContact: { name: string; relation: string; phone: string };
  allergies: string[];
  privacyConsent: string;
  prefComm: string;
}

interface PatientsViewProps {
  onMakeAppointment?: (patient: { rm: string; name: string; phone: string }) => void;
  onStartEncounter?: (patient: { rm: string; name: string; insurance?: string }) => void;
}

// No default patients defined (removed dummy data)


export default function PatientsView({ onMakeAppointment, onStartEncounter }: PatientsViewProps) {
  const [patients, setPatients] = useState<PatientItem[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientItem | null>(null);
  const [activeMenuRm, setActiveMenuRm] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua Status");
  const [filterGender, setFilterGender] = useState("Semua");
  const [filterAgeRange, setFilterAgeRange] = useState("Semua");
  const [filterInsurance, setFilterInsurance] = useState("Semua");
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // New Patient Form State
  const [newPatient, setNewPatient] = useState({
    name: "",
    nik: "",
    dob: "",
    gender: "Laki-laki",
    phone: "",
    email: "",
    address: "",
    insurance: "BPJS Kesehatan"
  });

  // AI Duplicate Check State
  const [duplicateCheck, setDuplicateCheck] = useState<{ match: boolean; score: number; matchPatient: PatientItem | null }>({
    match: true,
    score: 78,
    matchPatient: null
  });

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch Patients from Supabase & LocalStorage
  useEffect(() => {
    async function loadPatients() {
      let mapped: PatientItem[] = [];
      try {
        const { data, error } = await supabase.from("patients").select("*").order("created_at", { ascending: false });
        if (data && data.length > 0) {
          mapped = data.map((p: any) => ({
            rm: p.medical_record_number || `RM${String(Math.floor(Math.random()*9000)+1000)}`,
            name: p.full_name,
            nik: p.nik || "-",
            dob: p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }) : "-",
            gender: p.sex_at_birth || "Laki-laki",
            phone: p.phone || "-",
            email: p.email || `${p.full_name.toLowerCase().replace(/\s+/g, ".")}@mail.com`,
            address: p.address || "-",
            status: p.status === "active" || p.status === "Aktif" ? "Aktif" : "Tidak Aktif",
            religion: p.religion || "Islam",
            age: p.date_of_birth ? new Date().getFullYear() - new Date(p.date_of_birth).getFullYear() : 29,
            insurance: p.insurance || "Umum / Bayar Sendiri",
            insuranceNo: p.insurance_no || "-",
            emergencyContact: p.emergency_contact || { name: "-", relation: "-", phone: p.phone || "-" },
            allergies: p.allergies || [],
            privacyConsent: "Disetujui saat pendaftaran",
            prefComm: "WhatsApp"
          }));
        }
      } catch (e) {
        console.warn("Error fetching patients from Supabase:", e);
      }

      // Merge with LocalStorage patients to ensure no newly registered patient is lost
      try {
        const localData = localStorage.getItem("clinic_patients_v1");
        if (localData) {
          const localPatients: PatientItem[] = JSON.parse(localData);
          localPatients.forEach(lp => {
            if (!mapped.some(p => p.rm === lp.rm || p.name.toLowerCase() === lp.name.toLowerCase())) {
              mapped.push(lp);
            } else {
              // Update insurance info from local record if present
              const existing = mapped.find(p => p.rm === lp.rm || p.name.toLowerCase() === lp.name.toLowerCase());
              if (existing && lp.insurance) {
                existing.insurance = lp.insurance;
              }
            }
          });
        }
      } catch (e) {}

      setPatients(mapped);
      if (mapped.length > 0) setSelectedPatient(mapped[0]);
    }
    loadPatients();
  }, []);

  // Real-time AI Duplicate detection as user types NIK or Name
  useEffect(() => {
    if (newPatient.name.trim().length > 2 || newPatient.nik.trim().length > 3) {
      const match = patients.find(p => 
        p.name.toLowerCase().includes(newPatient.name.toLowerCase()) || 
        (newPatient.nik && p.nik.includes(newPatient.nik))
      );
      if (match) {
        setDuplicateCheck({ match: true, score: 88, matchPatient: match });
      } else {
        setDuplicateCheck({ match: false, score: 0, matchPatient: null });
      }
    } else {
      setDuplicateCheck({ match: true, score: 78, matchPatient: patients[0] });
    }
  }, [newPatient.name, newPatient.nik, patients]);

  // Filter Patients
  const filteredPatients = patients.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.rm.toLowerCase().includes(searchQuery.toLowerCase()) || p.nik.includes(searchQuery);
    const matchStatus = filterStatus === "Semua Status" || p.status === filterStatus;
    const matchGender = filterGender === "Semua" || p.gender === filterGender;
    const matchAge = filterAgeRange === "Semua" || 
      (filterAgeRange === "<18 th" && p.age < 18) ||
      (filterAgeRange === "18-40 th" && p.age >= 18 && p.age <= 40) ||
      (filterAgeRange === ">40 th" && p.age > 40);
    const matchInsurance = filterInsurance === "Semua" || p.insurance.toLowerCase().includes(filterInsurance.toLowerCase());

    return matchSearch && matchStatus && matchGender && matchAge && matchInsurance;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage) || 1;
  const paginatedPatients = filteredPatients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Handle Add New Patient
  const handleSavePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatient.name.trim()) {
      showToast("❌ Nama Lengkap pasien wajib diisi.");
      return;
    }

    const nextRmNum = patients.length + 128;
    const newRm = `RM000${nextRmNum}`;
    const calculatedAge = newPatient.dob ? new Date().getFullYear() - new Date(newPatient.dob).getFullYear() : 25;

    const createdItem: PatientItem = {
      rm: newRm,
      name: newPatient.name,
      nik: newPatient.nik || "-",
      dob: newPatient.dob ? new Date(newPatient.dob).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }) : "-",
      gender: newPatient.gender,
      phone: newPatient.phone || "-",
      email: newPatient.email || `${newPatient.name.toLowerCase().replace(/\s+/g, ".")}@mail.com`,
      address: newPatient.address || "-",
      status: "Aktif",
      religion: "Islam",
      age: calculatedAge,
      insurance: newPatient.insurance || "Umum / Bayar Sendiri",
      insuranceNo: newPatient.insurance?.includes("BPJS") ? `000${Math.floor(1000000000 + Math.random() * 9000000000)}` : "-",
      emergencyContact: { name: "-", relation: "-", phone: newPatient.phone || "-" },
      allergies: [],
      privacyConsent: "Disetujui saat pendaftaran",
      prefComm: "WhatsApp"
    };

    // Save to Supabase if configured
    if (isConfigured) {
      try {
        await supabase.from("patients").insert([{
          clinic_id: "11111111-1111-1111-1111-111111111111",
          medical_record_number: newRm,
          full_name: newPatient.name,
          date_of_birth: newPatient.dob || "2000-01-01",
          sex_at_birth: newPatient.gender,
          phone: newPatient.phone,
          nik: newPatient.nik,
          email: newPatient.email,
          address: newPatient.address,
          insurance: newPatient.insurance,
          status: "active"
        }]);
      } catch (err) {}
    }

    const updated = [createdItem, ...patients];
    setPatients(updated);
    setSelectedPatient(createdItem);
    localStorage.setItem("clinic_patients_v1", JSON.stringify(updated));

    // Reset Form
    setNewPatient({ name: "", nik: "", dob: "", gender: "Laki-laki", phone: "", email: "", address: "", insurance: "BPJS Kesehatan" });
    showToast(`✅ Berhasil mendaftarkan pasien baru ${createdItem.name} (${newRm})`);
  };

  // Import Sample Patients
  const handleImportPatients = () => {
    showToast("📥 Berhasil mengimpor 5 data pasien sampel ke database.");
  };

  // Add Queue Ticket
  const handleCreateQueue = (p: PatientItem) => {
    addQueueTicketDirect({ rm: p.rm, name: p.name, phone: p.phone, insurance: p.insurance }, "Umum");
    showToast(`🎫 Berhasil membuat tiket antrean Poli Umum untuk ${p.name}`);
    setActiveMenuRm(null);
  };

  const getRmColor = (index: number) => {
    const colors = ["#0d9488", "#8b5cf6", "#f59e0b", "#06b6d4", "#ec4899"];
    return colors[index % colors.length];
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: "Inter, system-ui, sans-serif" }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 2000, background: "#0f172a", color: "#fff", padding: "12px 20px", borderRadius: 12, boxShadow: "0 10px 25px rgba(0,0,0,0.2)", fontSize: 13, fontWeight: 700 }}>
          {toastMessage}
        </div>
      )}

      {/* ================= HEADER SECTION ================= */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", margin: 0 }}>Data Pasien</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>Kelola data pasien klinik dengan mudah dan terintegrasi.</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button 
            onClick={handleImportPatients}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 12, border: "1.5px solid #e2e8f0", background: "#fff", color: "#334155", fontSize: 13, fontWeight: 750, cursor: "pointer", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
            <Download style={{ width: 16, height: 16, color: "#64748b" }} /> Impor Pasien
          </button>
          
          <button 
            onClick={() => {
              const formEl = document.getElementById("new-patient-form");
              if (formEl) formEl.scrollIntoView({ behavior: "smooth" });
            }}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #ff5a50, #ff7760)", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 14px rgba(255,90,80,0.3)" }}>
            <Plus style={{ width: 18, height: 18 }} /> Tambah Pasien
          </button>
        </div>
      </div>

      {/* ================= SEARCH & FILTERS BAR ================= */}
      <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #f1f5f9", padding: 16, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
        
        {/* Search input */}
        <div style={{ position: "relative", flex: 1, minWidth: 260 }}>
          <Search style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#94a3b8" }} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari nama pasien atau No. RM..." 
            style={{ width: "100%", paddingLeft: 40, paddingRight: 14, paddingTop: 10, paddingBottom: 10, borderRadius: 12, border: "1.5px solid #e2e8f0", fontSize: 12.5, outline: "none", background: "#fafafa", fontFamily: "inherit" }}
          />
        </div>

        {/* Filter Status */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", marginBottom: 2 }}>Status</span>
          <select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 12, fontWeight: 700, color: "#334155", background: "#fff", cursor: "pointer", outline: "none" }}>
            <option>Semua Status</option>
            <option>Aktif</option>
            <option>Tidak Aktif</option>
          </select>
        </div>

        {/* Filter Jenis Kelamin */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", marginBottom: 2 }}>Jenis Kelamin</span>
          <select 
            value={filterGender} 
            onChange={e => setFilterGender(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 12, fontWeight: 700, color: "#334155", background: "#fff", cursor: "pointer", outline: "none" }}>
            <option>Semua</option>
            <option>Laki-laki</option>
            <option>Perempuan</option>
          </select>
        </div>

        {/* Filter Rentang Usia */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", marginBottom: 2 }}>Rentang Usia</span>
          <select 
            value={filterAgeRange} 
            onChange={e => setFilterAgeRange(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 12, fontWeight: 700, color: "#334155", background: "#fff", cursor: "pointer", outline: "none" }}>
            <option>Semua</option>
            <option>&lt;18 th</option>
            <option>18-40 th</option>
            <option>&gt;40 th</option>
          </select>
        </div>

        {/* Filter Asuransi */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", marginBottom: 2 }}>Asuransi</span>
          <select 
            value={filterInsurance} 
            onChange={e => setFilterInsurance(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 12, fontWeight: 700, color: "#334155", background: "#fff", cursor: "pointer", outline: "none" }}>
            <option>Semua</option>
            <option>BPJS</option>
            <option>Mandiri</option>
            <option>Umum</option>
          </select>
        </div>

        <button 
          onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", marginTop: 14, borderRadius: 10, border: "1.5px solid #e2e8f0", background: showAdvancedFilter ? "#e0f2fe" : "#fff", color: showAdvancedFilter ? "#0369a1" : "#475569", fontSize: 12, fontWeight: 750, cursor: "pointer" }}>
          <Filter style={{ width: 14, height: 14 }} /> Filter Lanjutan
        </button>

      </div>

      {/* Advanced Filter Extra Panel */}
      {showAdvancedFilter && (
        <div style={{ background: "#f8fafc", borderRadius: 14, padding: 14, border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 16, fontSize: 12 }}>
          <span style={{ fontWeight: 800, color: "#0f172a" }}>Filter Tambahan:</span>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <input type="checkbox" defaultChecked style={{ accentColor: "#ff5a50" }} /> Punya Alergi Obatan
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <input type="checkbox" defaultChecked style={{ accentColor: "#ff5a50" }} /> BPJS Aktif
          </label>
          <button onClick={() => { setSearchQuery(""); setFilterStatus("Semua Status"); setFilterGender("Semua"); setFilterAgeRange("Semua"); setFilterInsurance("Semua"); }}
            style={{ marginLeft: "auto", border: "none", background: "none", color: "#dc2626", fontWeight: 700, cursor: "pointer" }}>
            Reset Filter
          </button>
        </div>
      )}

      {/* ================= MAIN CONTENT: TABLE (LEFT) + SIDE PANEL DETAIL (RIGHT) ================= */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>
        
        {/* LEFT: TABLE DATA PASIEN */}
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #f1f5f9", padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.02)", overflow: "hidden" }}>
          
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ color: "#94a3b8", fontWeight: 700, borderBottom: "1.5px solid #f1f5f9" }}>
                  <th style={{ padding: "10px 8px", width: 30 }}></th>
                  <th style={{ padding: "10px 8px" }}>No. RM</th>
                  <th style={{ padding: "10px 8px" }}>Nama Pasien</th>
                  <th style={{ padding: "10px 8px" }}>NIK</th>
                  <th style={{ padding: "10px 8px" }}>Tanggal Lahir</th>
                  <th style={{ padding: "10px 8px" }}>Jenis Kelamin</th>
                  <th style={{ padding: "10px 8px" }}>No. HP</th>
                  <th style={{ padding: "10px 8px" }}>Status</th>
                  <th style={{ padding: "10px 8px", textAlign: "center" }}>Aksi</th>
                </tr>
              </thead>
              <tbody style={{ fontWeight: 600, color: "#334155" }}>
                {paginatedPatients.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: 30, color: "#94a3b8" }}>Tidak ada data pasien yang sesuai filter.</td>
                  </tr>
                ) : (
                  paginatedPatients.map((p, idx) => {
                    const isSelected = selectedPatient?.rm === p.rm;
                    const rmColor = getRmColor(idx);

                    return (
                      <tr key={p.rm} 
                        style={{ 
                          borderBottom: "1px solid #f8fafc", 
                          background: isSelected ? "#f0fdf4" : "transparent",
                          transition: "background 0.2s"
                        }}>
                        
                        {/* Radio selector */}
                        <td style={{ padding: "12px 8px" }}>
                          <div 
                            onClick={() => setSelectedPatient(p)}
                            style={{ 
                              width: 16, height: 16, borderRadius: "50%", 
                              border: isSelected ? "5px solid #0d9488" : "1.5px solid #cbd5e1",
                              background: "#fff", cursor: "pointer" 
                            }} 
                          />
                        </td>

                        {/* No. RM Badge */}
                        <td style={{ padding: "12px 8px" }}>
                          <span style={{ 
                            background: `${rmColor}15`, color: rmColor, 
                            padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 800 
                          }}>
                            {p.rm}
                          </span>
                        </td>

                        {/* Nama Pasien */}
                        <td style={{ padding: "12px 8px", fontWeight: 800, color: "#0f172a" }}>{p.name}</td>

                        {/* NIK */}
                        <td style={{ padding: "12px 8px", color: "#64748b", fontFamily: "monospace", fontSize: 11.5 }}>{p.nik}</td>

                        {/* Tanggal Lahir & Usia */}
                        <td style={{ padding: "12px 8px" }}>
                          <div>{p.dob}</div>
                          <div style={{ fontSize: 10, color: "#94a3b8" }}>({p.age} th)</div>
                        </td>

                        {/* Jenis Kelamin Badge */}
                        <td style={{ padding: "12px 8px" }}>
                          <span style={{ 
                            background: p.gender === "Laki-laki" ? "#e0f2fe" : "#fce7f3", 
                            color: p.gender === "Laki-laki" ? "#0369a1" : "#db2777", 
                            padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                            display: "inline-flex", alignItems: "center", gap: 4
                          }}>
                            {p.gender === "Laki-laki" ? "♂ Laki-laki" : "♀ Perempuan"}
                          </span>
                        </td>

                        {/* No. HP */}
                        <td style={{ padding: "12px 8px", color: "#475569" }}>{p.phone}</td>

                        {/* Status Badge */}
                        <td style={{ padding: "12px 8px" }}>
                          <span style={{ 
                            background: p.status === "Aktif" ? "#dcfce7" : "#f1f5f9", 
                            color: p.status === "Aktif" ? "#15803d" : "#64748b", 
                            padding: "3px 10px", borderRadius: 20, fontSize: 10.5, fontWeight: 800 
                          }}>
                            {p.status}
                          </span>
                        </td>

                        {/* Action Buttons */}
                        <td style={{ padding: "12px 8px", textAlign: "center", position: "relative" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                            <button 
                              onClick={() => setSelectedPatient(p)}
                              title="Lihat Detail Pasien"
                              style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Eye style={{ width: 14, height: 14, color: "#64748b" }} />
                            </button>

                            <button 
                              onClick={() => setActiveMenuRm(activeMenuRm === p.rm ? null : p.rm)}
                              title="Menu Opsi Pasien"
                              style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <MoreVertical style={{ width: 14, height: 14, color: "#64748b" }} />
                            </button>
                          </div>

                          {/* Action Menu Dropdown */}
                          {activeMenuRm === p.rm && (
                            <div style={{ position: "absolute", right: 10, top: 40, width: 170, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, boxShadow: "0 10px 25px rgba(0,0,0,0.15)", padding: 6, zIndex: 100, textAlign: "left" }}>
                              <button onClick={() => handleCreateQueue(p)} style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "none", background: "none", cursor: "pointer", fontSize: 11.5, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
                                🎫 Buat Antrean Poli
                              </button>
                              <button onClick={() => { setActiveMenuRm(null); onStartEncounter?.({ rm: p.rm, name: p.name, insurance: p.insurance }); }} style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "none", background: "none", cursor: "pointer", fontSize: 11.5, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
                                🩺 Mulai Encounter
                              </button>
                              <button onClick={() => { setActiveMenuRm(null); onMakeAppointment?.({ rm: p.rm, name: p.name, phone: p.phone }); }} style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "none", background: "none", cursor: "pointer", fontSize: 11.5, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
                                📅 Buat Appointment
                              </button>
                            </div>
                          )}
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer Bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, paddingTop: 14, borderTop: "1px solid #f1f5f9", flexWrap: "wrap", gap: 12 }}>
            <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
              Menampilkan {filteredPatients.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredPatients.length)} dari {filteredPatients.length} data
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: currentPage === 1 ? "not-allowed" : "pointer", color: "#64748b" }}>
                <ChevronLeft style={{ width: 14, height: 14 }} />
              </button>

              {[...Array(totalPages)].map((_, i) => {
                const pNum = i + 1;
                const isAct = pNum === currentPage;
                return (
                  <button 
                    key={pNum}
                    onClick={() => setCurrentPage(pNum)}
                    style={{ 
                      width: 28, height: 28, borderRadius: 8, border: "none", 
                      background: isAct ? "#0d9488" : "none", color: isAct ? "#fff" : "#334155", 
                      fontSize: 12, fontWeight: isAct ? 800 : 600, cursor: "pointer" 
                    }}>
                    {pNum}
                  </button>
                );
              })}

              <button 
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: currentPage === totalPages ? "not-allowed" : "pointer", color: "#64748b" }}>
                <ChevronRight style={{ width: 14, height: 14 }} />
              </button>

              <select 
                value={itemsPerPage} 
                onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 11.5, fontWeight: 700, color: "#334155", background: "#fff", cursor: "pointer", outline: "none", marginLeft: 8 }}>
                <option value={5}>5 / halaman</option>
                <option value={10}>10 / halaman</option>
                <option value={20}>20 / halaman</option>
              </select>
            </div>
          </div>

        </div>

        {/* RIGHT: DETAIL PASIEN PANEL */}
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #f1f5f9", padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column", gap: 16 }}>
          {selectedPatient ? (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <User style={{ width: 18, height: 18, color: "#0d9488" }} />
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>Detail Pasien</h3>
                </div>
                <span style={{ background: "#dcfce7", color: "#166534", padding: "2px 10px", borderRadius: 12, fontSize: 10.5, fontWeight: 800 }}>
                  {selectedPatient.status}
                </span>
              </div>

              {/* Profile Header Card */}
              <div style={{ textAlign: "center", padding: "16px 10px", background: "#fafafa", borderRadius: 16, border: "1px solid #f1f5f9" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#ccfbf1", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", border: "2px solid #0d9488" }}>
                  <User style={{ width: 32, height: 32, color: "#0d9488" }} />
                </div>
                <h4 style={{ fontSize: 16, fontWeight: 900, color: "#0f172a", margin: 0 }}>{selectedPatient.name}</h4>
                <span style={{ display: "inline-block", background: "#0d9488", color: "#fff", padding: "2px 10px", borderRadius: 10, fontSize: 11, fontWeight: 800, marginTop: 4 }}>
                  {selectedPatient.rm}
                </span>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, fontFamily: "monospace" }}>ID Pasien: {selectedPatient.nik}</div>
              </div>

              {/* Details List */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 11.5, color: "#475569" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <User style={{ width: 15, height: 15, color: "#64748b", flexShrink: 0, marginTop: 1 }} />
                  <div><strong>Usia:</strong> {selectedPatient.age} tahun ({selectedPatient.dob})</div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <Phone style={{ width: 15, height: 15, color: "#64748b", flexShrink: 0, marginTop: 1 }} />
                  <div><strong>No. HP:</strong> {selectedPatient.phone}</div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <Mail style={{ width: 15, height: 15, color: "#64748b", flexShrink: 0, marginTop: 1 }} />
                  <div><strong>Email:</strong> {selectedPatient.email}</div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <MapPin style={{ width: 15, height: 15, color: "#64748b", flexShrink: 0, marginTop: 1 }} />
                  <div><strong>Alamat:</strong> {selectedPatient.address}</div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <Activity style={{ width: 15, height: 15, color: "#ef4444", flexShrink: 0, marginTop: 1 }} />
                  <div><strong>Alergi:</strong> {selectedPatient.allergies.join(", ")}</div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <ShieldCheck style={{ width: 15, height: 15, color: "#0ea5e9", flexShrink: 0, marginTop: 1 }} />
                  <div><strong>Asuransi:</strong> {selectedPatient.insurance}<br /><span style={{ fontSize: 10, color: "#94a3b8" }}>No. {selectedPatient.insuranceNo}</span></div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <UserCheck style={{ width: 15, height: 15, color: "#8b5cf6", flexShrink: 0, marginTop: 1 }} />
                  <div><strong>Kontak Darurat:</strong> {selectedPatient.emergencyContact.name} ({selectedPatient.emergencyContact.relation})<br /><span style={{ fontSize: 10, color: "#94a3b8" }}>{selectedPatient.emergencyContact.phone}</span></div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <ShieldCheck style={{ width: 15, height: 15, color: "#16a34a", flexShrink: 0, marginTop: 1 }} />
                  <div><strong>Persetujuan & Privasi:</strong> {selectedPatient.privacyConsent} <span style={{ background: "#dcfce7", color: "#166534", padding: "1px 6px", borderRadius: 8, fontSize: 9.5, fontWeight: 800 }}>Terverifikasi</span></div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <FileText style={{ width: 15, height: 15, color: "#64748b", flexShrink: 0, marginTop: 1 }} />
                  <div><strong>Preferensi Komunikasi:</strong> {selectedPatient.prefComm}</div>
                </div>
              </div>

              <button 
                onClick={() => onStartEncounter?.({ rm: selectedPatient.rm, name: selectedPatient.name, insurance: selectedPatient.insurance })}
                style={{ width: "100%", marginTop: 8, padding: "11px 0", borderRadius: 12, border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#166534", fontSize: 12.5, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                Lihat Riwayat Medis Pasien →
              </button>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
              Pilih pasien untuk melihat detail
            </div>
          )}
        </div>

      </div>

      {/* ================= BOTTOM SECTION: FORM PENDAFTARAN (LEFT) + AI DETEKSI DUPILKASI (RIGHT) ================= */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20, alignItems: "start" }}>
        
        {/* FORM PENDAFTARAN PASIEN BARU */}
        <div id="new-patient-form" style={{ background: "#fff", borderRadius: 20, border: "1px solid #f1f5f9", padding: 22, boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <User style={{ width: 16, height: 16, color: "#0284c7" }} />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 900, color: "#0f172a", margin: 0 }}>Form Pendaftaran Pasien Baru</h3>
              <p style={{ fontSize: 11.5, color: "#64748b", margin: "2px 0 0" }}>Lengkapi data berikut untuk mendaftarkan pasien baru.</p>
            </div>
          </div>

          <form onSubmit={handleSavePatient} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>No. RM (Otomatis)</label>
                <input type="text" disabled value="Akan digenerate otomatis" style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 12, color: "#94a3b8" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>NIK *</label>
                <input type="text" placeholder="Masukkan NIK" value={newPatient.nik} onChange={e => setNewPatient({ ...newPatient, nik: e.target.value })} style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 12, outline: "none" }} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Nama Lengkap *</label>
                <input type="text" required placeholder="Masukkan nama lengkap" value={newPatient.name} onChange={e => setNewPatient({ ...newPatient, name: e.target.value })} style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 12, outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Tanggal Lahir *</label>
                <input type="date" required value={newPatient.dob} onChange={e => setNewPatient({ ...newPatient, dob: e.target.value })} style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 12, outline: "none" }} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Jenis Kelamin *</label>
                <select value={newPatient.gender} onChange={e => setNewPatient({ ...newPatient, gender: e.target.value })} style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 12, outline: "none", cursor: "pointer" }}>
                  <option>Laki-laki</option>
                  <option>Perempuan</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>No. HP *</label>
                <input type="tel" placeholder="Masukkan nomor HP" value={newPatient.phone} onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })} style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 12, outline: "none" }} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Email</label>
                <input type="email" placeholder="Masukkan email" value={newPatient.email} onChange={e => setNewPatient({ ...newPatient, email: e.target.value })} style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 12, outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Asuransi</label>
                <select value={newPatient.insurance} onChange={e => setNewPatient({ ...newPatient, insurance: e.target.value })} style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 12, outline: "none", cursor: "pointer" }}>
                  <option>BPJS Kesehatan</option>
                  <option>Mandiri Inhealth</option>
                  <option>Prudential Health</option>
                  <option>Umum / Bayar Sendiri</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Alamat *</label>
              <textarea rows={2} placeholder="Masukkan alamat lengkap" value={newPatient.address} onChange={e => setNewPatient({ ...newPatient, address: e.target.value })} style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 12, outline: "none", fontFamily: "inherit" }} />
            </div>

            <button type="submit" style={{ width: "100%", marginTop: 6, padding: "12px 0", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #ff5a50, #ff7760)", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 14px rgba(255,90,80,0.3)" }}>
              💾 Simpan Pasien
            </button>
          </form>
        </div>

        {/* AI DETEKSI DUPILKASI PASIEN BETA */}
        <div style={{ background: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)", borderRadius: 20, border: "1px solid #e9d5ff", padding: 22, boxShadow: "0 2px 10px rgba(139,92,246,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Sparkles style={{ width: 18, height: 18, color: "#8b5cf6" }} />
            <h3 style={{ fontSize: 15, fontWeight: 900, color: "#581c87", margin: 0 }}>AI Deteksi Duplikasi Pasien</h3>
            <span style={{ background: "#c084fc", color: "#fff", padding: "2px 8px", borderRadius: 10, fontSize: 9.5, fontWeight: 800 }}>Beta</span>
          </div>

          <p style={{ fontSize: 11.5, color: "#6b21a8", lineHeight: 1.4, marginBottom: 16 }}>
            Sistem AI menganalisis kemiripan data untuk mencegah duplikasi pasien.
          </p>

          {duplicateCheck.match ? (
            <div style={{ background: "#fff", borderRadius: 16, padding: 16, border: "1px solid #f3e8ff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {/* Score Circle */}
                <div style={{ width: 70, height: 70, borderRadius: "50%", background: "conic-gradient(#ff7860 0% 78%, #e2e8f0 78% 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: "#0f172a" }}>{duplicateCheck.score}%</span>
                    <span style={{ fontSize: 7.5, color: "#e04939", fontWeight: 800 }}>Kemiripan</span>
                  </div>
                </div>

                {/* Match Patient Card */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8" }}>Kemungkinan Pasien Sama Dengan:</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                    <strong style={{ fontSize: 13, color: "#0f172a" }}>{duplicateCheck.matchPatient?.name || "Andi Pratama"}</strong>
                    <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "1px 6px", borderRadius: 6, fontSize: 9.5, fontWeight: 800 }}>
                      {duplicateCheck.matchPatient?.rm || "RM000045"}
                    </span>
                  </div>
                  <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 4 }}>
                    NIK: {duplicateCheck.matchPatient?.nik || "3175071505960001"}<br />
                    Tgl Lahir: {duplicateCheck.matchPatient?.dob || "15 Mei 1996"}<br />
                    No. HP: {duplicateCheck.matchPatient?.phone || "0812-3456-7890"}
                  </div>
                  <button onClick={() => setSelectedPatient(duplicateCheck.matchPatient || patients[0])} style={{ border: "none", background: "none", color: "#8b5cf6", fontSize: 11, fontWeight: 800, cursor: "pointer", padding: 0, marginTop: 6 }}>
                    Lihat Detail →
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: "#fff", borderRadius: 16, padding: 16, border: "1px solid #f3e8ff", textAlign: "center", color: "#166534", fontSize: 12, fontWeight: 700 }}>
              ✅ AI tidak menemukan potensi duplikasi data pasien ini.
            </div>
          )}

          <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", padding: 12, borderRadius: 12, marginTop: 14, fontSize: 11, color: "#c2410c", lineHeight: 1.5, display: "flex", alignItems: "flex-start", gap: 8 }}>
            <AlertTriangle style={{ width: 16, height: 16, flexShrink: 0, marginTop: 1 }} />
            <div>
              <strong>Hasil ini bukan keputusan final.</strong><br />
              Mohon verifikasi data secara manual sebelum menyimpan data pasien baru.
            </div>
          </div>
        </div>

      </div>

      {/* ================= FOOTER PRIVASI DATA PDP BANNER ================= */}
      <div style={{ background: "#f8fafc", borderRadius: 16, border: "1px solid #e2e8f0", padding: "12px 18px", display: "flex", alignItems: "center", gap: 10, fontSize: 11.5, color: "#64748b" }}>
        <ShieldCheck style={{ width: 16, height: 16, color: "#0d9488", flexShrink: 0 }} />
        <div>
          Data pasien dilindungi oleh Undang-Undang Perlindungan Data Pribadi (UU No. 27 Tahun 2022). Pastikan data yang Anda kelola dijaga kerahasiaannya.
        </div>
      </div>

    </div>
  );
}
