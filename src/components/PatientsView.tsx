"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, Plus, Download, MoreVertical, ChevronLeft, 
  ChevronRight, AlertCircle, CheckCircle, ShieldAlert, 
  Mail, Phone, MessageSquare, Edit2, Calendar, FileText, 
  AlertTriangle, Trash2, HeartPulse, ShieldCheck, UserCheck, Database,
  Users
} from "lucide-react";
import { supabase, isConfigured } from "@/lib/supabase/client";
import { addQueueTicketDirect } from "@/lib/store";

export interface Patient {
  rm: string;
  name: string;
  nik: string;
  dob: string;
  gender: string;
  phone: string;
  status: "Aktif" | "VIP" | "Perlu Verifikasi";
  religion: string;
  age: number;
  insurance: string;
  insuranceNo: string;
  emergencyContact: { name: string; relation: string; phone: string; address: string };
  allergies: string[];
  conditions: string[];
}

interface PatientsViewProps {
  onMakeAppointment?: (patient: { rm: string; name: string; phone: string }) => void;
  onStartEncounter?: (patient: { rm: string; name: string }) => void;
}

export default function PatientsView({ onMakeAppointment, onStartEncounter }: PatientsViewProps = {}) {
  const [patients, setPatients] = useState<Patient[]>(isConfigured ? [] : [
    {
      rm: "RM0001234",
      name: "Andi Pratama",
      nik: "3374120505900001",
      dob: "05 Mei 1990",
      gender: "Laki-laki",
      phone: "0812-3456-7890",
      status: "Aktif",
      religion: "Islam",
      age: 36,
      insurance: "BPJS Kesehatan",
      insuranceNo: "0009876543210",
      emergencyContact: { name: "Budi Pratama", relation: "Kakak", phone: "0812-1111-2222", address: "Jl. Mawar No. 5, Semarang" },
      allergies: ["Paracetamol"],
      conditions: ["Asma"]
    },
    {
      rm: "RM0001235",
      name: "Siti Nurhaliza",
      nik: "3374125703980002",
      dob: "17 Mar 1998",
      gender: "Perempuan",
      phone: "0812-1122-3344",
      status: "Aktif",
      religion: "Islam",
      age: 28,
      insurance: "Mandiri Inhealth",
      insuranceNo: "0001122334455",
      emergencyContact: { name: "Ahmad", relation: "Suami", phone: "0812-9999-8888", address: "Jl. Anggrek No. 8, Semarang" },
      allergies: [],
      conditions: []
    },
    {
      rm: "RM0001236",
      name: "Budi Santoso",
      nik: "3374121502850003",
      dob: "15 Feb 1985",
      gender: "Laki-laki",
      phone: "0812-5566-7788",
      status: "VIP",
      religion: "Islam",
      age: 40,
      insurance: "BPJS Kesehatan",
      insuranceNo: "0001234567890",
      emergencyContact: { name: "Siti Rahayu", relation: "Istri", phone: "0812-3344-5566", address: "Jl. Melati No. 12, Semarang" },
      allergies: ["Penicillin", "Ibuprofen"],
      conditions: ["Hipertensi", "Diabetes Melitus Tipe 2"]
    },
    {
      rm: "RM0001237",
      name: "Dewi Kartika",
      nik: "3374122304920004",
      dob: "23 Apr 1992",
      gender: "Perempuan",
      phone: "0813-2233-4455",
      status: "Perlu Verifikasi",
      religion: "Kristen",
      age: 34,
      insurance: "Umum",
      insuranceNo: "-",
      emergencyContact: { name: "Gunawan", relation: "Orang Tua", phone: "0813-4455-6677", address: "Jl. Dahlia No. 2, Semarang" },
      allergies: [],
      conditions: []
    },
    {
      rm: "RM0001238",
      name: "Rudi Setiawan",
      nik: "3374121010880005",
      dob: "10 Okt 1988",
      gender: "Laki-laki",
      phone: "0812-9988-7766",
      status: "Aktif",
      religion: "Islam",
      age: 37,
      insurance: "Prudential",
      insuranceNo: "PRU-88998899",
      emergencyContact: { name: "Lina", relation: "Istri", phone: "0812-8888-7777", address: "Jl. Tulip No. 15, Semarang" },
      allergies: ["Sulfa"],
      conditions: ["Hiperkolesterolemia"]
    },
    {
      rm: "RM0001239",
      name: "Intan Permata",
      nik: "3374120707010006",
      dob: "07 Jul 2001",
      gender: "Perempuan",
      phone: "0812-5544-6677",
      status: "Aktif",
      religion: "Islam",
      age: 25,
      insurance: "BPJS Kesehatan",
      insuranceNo: "0005544332211",
      emergencyContact: { name: "Heri", relation: "Ayah", phone: "0812-7777-6666", address: "Jl. Kamboja No. 9, Semarang" },
      allergies: [],
      conditions: []
    },
    {
      rm: "RM0001240",
      name: "Ayu Lestari",
      nik: "3374123006940007",
      dob: "30 Jun 1994",
      gender: "Perempuan",
      phone: "0813-8899-1234",
      status: "VIP",
      religion: "Islam",
      age: 32,
      insurance: "Allianz",
      insuranceNo: "AZ-445522",
      emergencyContact: { name: "Rian", relation: "Suami", phone: "0813-7777-1111", address: "Jl. Sakura No. 10, Semarang" },
      allergies: ["Aspirin"],
      conditions: []
    },
    {
      rm: "RM0001241",
      name: "Fajar Nugroho",
      nik: "3374121205920008",
      dob: "12 Mei 1992",
      gender: "Laki-laki",
      phone: "0812-6677-8899",
      status: "Perlu Verifikasi",
      religion: "Islam",
      age: 34,
      insurance: "Umum",
      insuranceNo: "-",
      emergencyContact: { name: "Slamet", relation: "Ayah", phone: "0812-5555-4444", address: "Jl. Melati No. 10, Semarang" },
      allergies: [],
      conditions: []
    }
  ]);

  const [selectedRm, setSelectedRm] = useState<string>(isConfigured ? "" : "RM0001236"); // Default Budi Santoso
  const [editingRm, setEditingRm] = useState<string | null>(null);

  useEffect(() => {
    const client = supabase;
    if (isConfigured && client) {
      const fetchPatients = async () => {
        const { data, error } = await client
          .from("patients")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.warn("Error fetching patients from Supabase:", error);
          return;
        }

        if (data && data.length > 0) {
          const mapped: Patient[] = data.map(item => {
            const mappedStatus = item.status === "active" ? "Aktif" : item.status === "VIP" ? "VIP" : "Perlu Verifikasi";
            return {
              rm: item.medical_record_number,
              name: item.full_name,
              nik: item.nik || "-",
              dob: formatDateString(item.date_of_birth),
              gender: item.sex_at_birth,
              phone: item.phone || "-",
              status: mappedStatus,
              religion: item.religion || "Islam",
              age: calculateAge(item.date_of_birth),
              insurance: "Umum",
              insuranceNo: "-",
              emergencyContact: {
                name: "-",
                relation: "-",
                phone: "-",
                address: "-"
              },
              allergies: [],
              conditions: []
            };
          });
          setPatients(mapped);
          if (mapped.length > 0) {
            setSelectedRm(mapped[0].rm);
          }
        }
      };

      fetchPatients();
    }
  }, []);
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("Semua");
  const [statusFilter, setStatusFilter] = useState("Semua");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Checkbox Selection State
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // Local Activity Logs State
  const [recentActivities, setRecentActivities] = useState([
    { time: "10:15", user: "dr. Maya Lestari", desc: "Membuka modul pasien" },
    { time: "Kemarin", user: "apt. Dwi Putri", desc: "Update nomor HP RM0001237 - Dewi Kartika" },
    { time: "21 Mei 2025", user: "admin.resep", desc: "Update data asuransi RM0001235 - Siti Nurhaliza" },
    { time: "20 Mei 2025", user: "lab.ani", desc: "Update gol. darah RM0001238 - Rudi Setiawan" },
  ]);

  // Form State
  const [formName, setFormName] = useState("");
  const [formDob, setFormDob] = useState("");
  const [formGender, setFormGender] = useState("Laki-laki");
  const [formPhone, setFormPhone] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formNik, setFormNik] = useState("");
  const [formConsent, setFormConsent] = useState(false);

  const selectedPatient = patients.find(p => p.rm === selectedRm) || patients[0];

  // Actions
  const parseDateStringToInput = (dateStr: string) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const parts = dateStr.split(" ");
    if (parts.length !== 3) return "";
    const day = parts[0].padStart(2, "0");
    const year = parts[2];
    const monthStr = parts[1].toLowerCase();
    let month = "01";
    if (monthStr.startsWith("jan")) month = "01";
    else if (monthStr.startsWith("feb")) month = "02";
    else if (monthStr.startsWith("mar")) month = "03";
    else if (monthStr.startsWith("apr")) month = "04";
    else if (monthStr.startsWith("mei") || monthStr.startsWith("may")) month = "05";
    else if (monthStr.startsWith("jun")) month = "06";
    else if (monthStr.startsWith("jul")) month = "07";
    else if (monthStr.startsWith("agu") || monthStr.startsWith("aug")) month = "08";
    else if (monthStr.startsWith("sep")) month = "09";
    else if (monthStr.startsWith("okt") || monthStr.startsWith("oct")) month = "10";
    else if (monthStr.startsWith("nov")) month = "11";
    else if (monthStr.startsWith("des") || monthStr.startsWith("dec")) month = "12";
    return `${year}-${month}-${day}`;
  };

  const handleSelectPatient = (rm: string) => {
    setSelectedRm(rm);
  };

  const addActivity = (desc: string) => {
    const now = new Date();
    const timeStr = String(now.getHours()).padStart(2, '0') + ":" + String(now.getMinutes()).padStart(2, '0');
    setRecentActivities(prev => [{ time: timeStr, user: "dr. Maya Lestari", desc }, ...prev.slice(0, 5)]);
  };

  const handleToggleRow = (rm: string) => {
    setSelectedRows(prev => 
      prev.includes(rm) ? prev.filter(r => r !== rm) : [...prev, rm]
    );
  };

  const handleToggleAll = (currentPageRms: string[]) => {
    const allSelected = currentPageRms.every(rm => selectedRows.includes(rm));
    if (allSelected) {
      setSelectedRows(prev => prev.filter(rm => !currentPageRms.includes(rm)));
    } else {
      setSelectedRows(prev => Array.from(new Set([...prev, ...currentPageRms])));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return;
    if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedRows.length} pasien terpilih?`)) {
      return;
    }

    const client = supabase;
    if (isConfigured && client) {
      const { error } = await client
        .from("patients")
        .delete()
        .in("medical_record_number", selectedRows);

      if (error) {
        console.warn("Error bulk deleting patients from Supabase:", error);
        alert("Gagal menghapus beberapa pasien: " + error.message);
        return;
      }
    }

    setPatients(prev => prev.filter(p => !selectedRows.includes(p.rm)));
    addActivity(`Menghapus ${selectedRows.length} pasien terpilih secara massal`);
    setSelectedRows([]);
    setSelectedRm("");
    alert("Beberapa pasien berhasil dihapus.");
  };

  const handleExportCSV = () => {
    if (patients.length === 0) {
      alert("Tidak ada data pasien untuk diekspor.");
      return;
    }
    const headers = ["No. RM", "Nama Lengkap", "NIK", "Tanggal Lahir", "Jenis Kelamin", "No. HP", "Agama", "Asuransi", "No. Kartu", "Alamat"];
    const rows = patients.map(p => [
      p.rm,
      p.name,
      p.nik,
      p.dob,
      p.gender,
      p.phone,
      p.religion,
      p.insurance,
      p.insuranceNo,
      p.emergencyContact.address.replace(/"/g, '""')
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Data_Pasien_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addActivity("Mengekspor daftar pasien ke CSV");
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      
      const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length <= 1) {
        alert("CSV kosong atau tidak valid.");
        return;
      }
      
      const newPatientsList: Patient[] = [];
      const dbInserts: any[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(",").map(val => {
          let s = val.trim();
          if (s.startsWith('"') && s.endsWith('"')) {
            s = s.substring(1, s.length - 1);
          }
          return s;
        });
        
        if (row.length < 5) continue;
        
        const rm = row[0] || `RM000${1234 + patients.length + i}`;
        const name = row[1] || "Tanpa Nama";
        const nik = row[2] || "-";
        const dob = row[3] || "1990-01-01";
        const gender = row[4] || "Laki-laki";
        const phone = row[5] || "-";
        const religion = row[6] || "Islam";
        const insurance = row[7] || "Umum";
        const insuranceNo = row[8] || "-";
        const address = row[9] || "-";
        
        const age = calculateAge(parseDateStringToInput(dob) || "1990-01-01");
        
        newPatientsList.push({
          rm,
          name,
          nik,
          dob: dob.includes("-") ? formatDateString(dob) : dob,
          gender,
          phone,
          status: "Aktif",
          religion,
          age,
          insurance,
          insuranceNo,
          emergencyContact: {
            name: "-",
            relation: "-",
            phone: "-",
            address
          },
          allergies: [],
          conditions: []
        });
        
        dbInserts.push({
          clinic_id: "11111111-1111-1111-1111-111111111111",
          medical_record_number: rm,
          full_name: name,
          date_of_birth: parseDateStringToInput(dob) || "1990-01-01",
          sex_at_birth: gender,
          phone,
          nik: nik === "-" ? null : nik,
          religion,
          status: "active"
        });
      }
      
      const client = supabase;
      if (isConfigured && client && dbInserts.length > 0) {
        const { error } = await client
          .from("patients")
          .insert(dbInserts);
        if (error) {
          console.warn("Failed to import patients to Supabase:", error);
          alert("Sebagian/seluruh data gagal diimpor ke Supabase: " + error.message);
          return;
        }
      }
      
      setPatients(prev => [...newPatientsList, ...prev]);
      addActivity(`Mengimpor ${newPatientsList.length} pasien dari CSV`);
      alert(`Berhasil mengimpor ${newPatientsList.length} pasien.`);
    };
    reader.readAsText(file);
    e.target.value = ""; // reset
  };

  const startEdit = (p: Patient) => {
    setEditingRm(p.rm);
    setFormName(p.name);
    setFormDob(parseDateStringToInput(p.dob));
    setFormGender(p.gender);
    setFormPhone(p.phone);
    setFormNik(p.nik === "-" ? "" : p.nik);
    setFormAddress(p.emergencyContact.address === "-" ? "" : p.emergencyContact.address);
    setFormConsent(true);
  };

  const handleCancelEdit = () => {
    setEditingRm(null);
    setFormName("");
    setFormDob("");
    setFormPhone("");
    setFormAddress("");
    setFormNik("");
    setFormConsent(false);
  };

  const handleUpdatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRm) return;
    if (!formName || !formDob || !formPhone) {
      alert("Harap isi semua field wajib (*).");
      return;
    }

    const client = supabase;
    if (isConfigured && client) {
      const { error } = await client
        .from("patients")
        .update({
          full_name: formName,
          date_of_birth: formDob,
          sex_at_birth: formGender,
          phone: formPhone,
          nik: formNik || null,
        })
        .eq("medical_record_number", editingRm);

      if (error) {
        console.warn("Error updating patient in Supabase:", error);
        alert("Gagal memperbarui pasien di Supabase: " + error.message);
        return;
      }
    }

    setPatients(prev => prev.map(p => p.rm === editingRm ? {
      ...p,
      name: formName,
      dob: formatDateString(formDob),
      gender: formGender,
      phone: formPhone,
      nik: formNik || "-",
      age: calculateAge(formDob),
      emergencyContact: {
        ...p.emergencyContact,
        address: formAddress || "-"
      }
    } : p));

    addActivity(`Update data pasien ${formName} (${editingRm})`);
    alert("Data pasien berhasil diperbarui.");
    handleCancelEdit();
  };

  const handleDeletePatient = async (rm: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data pasien "${name}" (${rm})?`)) {
      return;
    }

    const client = supabase;
    if (isConfigured && client) {
      const { error } = await client
        .from("patients")
        .delete()
        .eq("medical_record_number", rm);

      if (error) {
        console.warn("Error deleting patient from Supabase:", error);
        alert("Gagal menghapus pasien dari Supabase: " + error.message);
        return;
      }
    }

    setPatients(prev => prev.filter(p => p.rm !== rm));
    if (selectedRm === rm) {
      setSelectedRm("");
    }
    addActivity(`Menghapus data pasien ${name} (${rm})`);
    alert(`Pasien "${name}" berhasil dihapus.`);
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formDob || !formPhone || !formConsent) {
      alert("Harap isi semua field wajib (*) dan setujui Kebijakan Privasi.");
      return;
    }
    const nextRm = `RM000${1234 + patients.length}`;

    const client = supabase;
    if (isConfigured && client) {
      const { data, error } = await client
        .from("patients")
        .insert([{
          clinic_id: "11111111-1111-1111-1111-111111111111",
          medical_record_number: nextRm,
          full_name: formName,
          date_of_birth: formDob,
          sex_at_birth: formGender,
          phone: formPhone,
          nik: formNik || null,
          religion: "Islam",
          status: "active"
        }])
        .select();

      if (error) {
        console.warn("Error creating patient in Supabase:", error);
        alert("Gagal menyimpan pasien ke Supabase: " + error.message);
        return;
      }
    }

    const newPatient: Patient = {
      rm: nextRm,
      name: formName,
      nik: formNik || "337412" + Math.floor(1000000000 + Math.random() * 9000000000),
      dob: formatDateString(formDob),
      gender: formGender,
      phone: formPhone,
      status: "Aktif",
      religion: "Islam",
      age: calculateAge(formDob),
      insurance: "Umum",
      insuranceNo: "-",
      emergencyContact: {
        name: "-",
        relation: "-",
        phone: "-",
        address: formAddress || "-"
      },
      allergies: [],
      conditions: []
    };

    setPatients([newPatient, ...patients]);
    setSelectedRm(nextRm);
    addActivity(`Mendaftarkan pasien baru ${formName} (${nextRm})`);
    // Clear form
    setFormName("");
    setFormDob("");
    setFormPhone("");
    setFormAddress("");
    setFormNik("");
    setFormConsent(false);
  };

  const handleClearForm = () => {
    setFormName("");
    setFormDob("");
    setFormPhone("");
    setFormAddress("");
    setFormNik("");
    setFormConsent(false);
  };

  // Helper formatting
  const formatDateString = (dateStr: string) => {
    if (!dateStr) return "";
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const calculateAge = (dateStr: string) => {
    const today = new Date();
    const birthDate = new Date(dateStr);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Filtering
  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.rm.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.nik.includes(searchTerm) ||
                          p.phone.includes(searchTerm);
    const matchesGender = genderFilter === "Semua" || p.gender === genderFilter;
    const matchesStatus = statusFilter === "Semua" || p.status === statusFilter;
    return matchesSearch && matchesGender && matchesStatus;
  });

  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPatients = filteredPatients.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const potentialDuplicate = formName.length > 2 
    ? patients.find(p => p.name.toLowerCase().includes(formName.toLowerCase()) && p.rm !== editingRm)
    : null;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      
      {/* Left Workspace: Table, Form & AI panels */}
      <div className="flex-1 space-y-6">
        
        {/* Header & Main Data Table Panel */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
                <span>Data Pasien</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center space-x-1 ${isConfigured ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-slate-100 text-slate-550 border border-slate-200"}`}>
                  <Database className="w-3 h-3" />
                  <span>{isConfigured ? "Supabase Cloud" : "Simulasi Lokal"}</span>
                </span>
              </h2>
              <div className="text-xs text-slate-400 font-semibold space-x-1.5 mt-1">
                <span>Pasien</span>
                <span>&gt;</span>
                <span className="text-slate-500">Data Pasien</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {selectedRows.length > 0 && (
                <button 
                  onClick={handleBulkDelete}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center space-x-1.5 transition-colors shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus Terpilih ({selectedRows.length})</span>
                </button>
              )}
              <button 
                onClick={() => {
                  const el = document.getElementById("pendaftaran-form");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="bg-teal-650 hover:bg-teal-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center space-x-1.5 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Pasien</span>
              </button>
              
              <input 
                type="file" 
                id="import-csv-file" 
                accept=".csv" 
                className="hidden" 
                onChange={handleImportCSV} 
              />
              <button 
                onClick={() => document.getElementById("import-csv-file")?.click()}
                className="border border-slate-200 text-slate-650 hover:bg-slate-50 font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center space-x-1.5 transition-colors"
              >
                <Plus className="w-4 h-4 text-slate-400" />
                <span>Import Data</span>
              </button>
              
              <button 
                onClick={handleExportCSV}
                className="border border-slate-200 text-slate-500 hover:bg-slate-50 p-2.5 rounded-xl"
                title="Ekspor CSV"
              >
                <Download className="w-4 h-4 text-slate-650" />
              </button>
            </div>
          </div>

          {/* Search Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50/50 p-3 rounded-xl">
            <div className="relative md:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari nama, No. RM, NIK, atau No. HP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-500 font-semibold text-slate-700"
              />
            </div>
            <div>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full py-2 px-3 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-500 font-semibold text-slate-650"
              >
                <option value="Semua">Semua Status</option>
                <option value="Aktif">Aktif</option>
                <option value="VIP">VIP</option>
                <option value="Perlu Verifikasi">Perlu Verifikasi</option>
              </select>
            </div>
            <div>
              <select 
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="w-full py-2 px-3 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-500 font-semibold text-slate-650"
              >
                <option value="Semua">Semua Jenis Kelamin</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
          </div>

          {/* Patients Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-450 font-bold bg-slate-50/30">
                  <th className="py-2.5 px-3">
                    <input 
                      type="checkbox" 
                      className="rounded text-teal-650 focus:ring-teal-500" 
                      checked={paginatedPatients.length > 0 && paginatedPatients.every(p => selectedRows.includes(p.rm))}
                      onChange={() => handleToggleAll(paginatedPatients.map(p => p.rm))}
                    />
                  </th>
                  <th className="py-2.5 px-3">No. RM</th>
                  <th className="py-2.5 px-3">Nama Pasien</th>
                  <th className="py-2.5 px-3">NIK</th>
                  <th className="py-2.5 px-3">Tanggal Lahir</th>
                  <th className="py-2.5 px-3">Jenis Kelamin</th>
                  <th className="py-2.5 px-3">No. HP</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedPatients.map((p) => (
                  <tr 
                    key={p.rm} 
                    onClick={() => handleSelectPatient(p.rm)}
                    className={`hover:bg-slate-50/60 cursor-pointer transition-colors ${selectedRm === p.rm ? "bg-teal-50/40 font-semibold text-teal-950" : ""}`}
                  >
                    <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        className="rounded text-teal-650 focus:ring-teal-500" 
                        checked={selectedRows.includes(p.rm)}
                        onChange={() => handleToggleRow(p.rm)}
                      />
                    </td>
                    <td className="py-2.5 px-3 font-bold text-teal-600">{p.rm}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{p.name}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-550">{p.nik}</td>
                    <td className="py-2.5 px-3 text-slate-550">{p.dob}</td>
                    <td className="py-2.5 px-3 text-slate-550">
                      {p.gender === "Laki-laki" ? (
                        <span className="flex items-center space-x-1"><span className="text-blue-500">♂</span> <span>Laki-laki</span></span>
                      ) : (
                        <span className="flex items-center space-x-1"><span className="text-pink-500">♀</span> <span>Perempuan</span></span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-550">{p.phone}</td>
                    <td className="py-2.5 px-3">
                      {p.status === "VIP" ? (
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md text-[10px] font-extrabold shadow-sm">VIP</span>
                      ) : p.status === "Perlu Verifikasi" ? (
                        <span className="px-2 py-0.5 bg-orange-50 text-orange-700 rounded-md text-[10px] font-extrabold">Perlu Verifikasi</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-extrabold">Aktif</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-center space-x-1.5">
                        <button 
                          onClick={() => {
                            if (onMakeAppointment) {
                              onMakeAppointment({ rm: p.rm, name: p.name, phone: p.phone });
                            }
                          }}
                          className="p-1 hover:bg-teal-50 text-teal-600 rounded-lg transition-colors"
                          title="Buat Appointment Pasien Ini"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => startEdit(p)}
                          className="p-1 hover:bg-slate-100 text-teal-650 rounded-lg transition-colors"
                          title="Edit Pasien"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeletePatient(p.rm, p.name)}
                          className="p-1 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                          title="Hapus Pasien"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Pagination footer */}
          <div className="flex flex-col sm:flex-row justify-between items-center text-xs font-semibold text-slate-450 border-t border-slate-50 pt-3 gap-2.5">
            <span>
              Menampilkan {filteredPatients.length > 0 ? startIndex + 1 : 0} - {Math.min(startIndex + itemsPerPage, filteredPatients.length)} dari {filteredPatients.length} data
            </span>
            {totalPages > 1 && (
              <div className="flex items-center space-x-1 bg-slate-50 px-2 py-1 rounded-xl">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="p-1 hover:bg-slate-200 text-slate-400 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                      currentPage === i + 1 
                        ? "bg-teal-650 text-white shadow-sm" 
                        : "hover:bg-slate-200 text-slate-600"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="p-1 hover:bg-slate-200 text-slate-400 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <div>
              <select 
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-slate-250 bg-white rounded-lg px-2 py-1 text-slate-600 font-semibold focus:outline-none"
              >
                <option value={5}>5 / halaman</option>
                <option value={10}>10 / halaman</option>
                <option value={20}>20 / halaman</option>
                <option value={50}>50 / halaman</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bottom Panel: Register Patient, AI Duplicate Risk, Activity Logs */}
        <div id="pendaftaran-form" className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* New Patient Registration Form / Edit Patient Form */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <h4 className="font-bold text-slate-800 text-sm flex items-center space-x-1.5">
              <UserCheck className="w-4 h-4 text-teal-600" />
              <span>{editingRm ? `Edit Data Pasien` : `Pendaftaran Pasien Baru`}</span>
            </h4>
            
            <form onSubmit={editingRm ? handleUpdatePatient : handleCreatePatient} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-550 block mb-1">Nama Lengkap*</label>
                <input 
                  type="text" 
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Masukkan nama lengkap"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-500 font-semibold text-slate-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-550 block mb-1">Tanggal Lahir*</label>
                  <input 
                    type="date" 
                    value={formDob}
                    onChange={(e) => setFormDob(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-500 font-semibold text-slate-700"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-550 block mb-1">Jenis Kelamin</label>
                  <select 
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-500 font-semibold text-slate-700"
                  >
                    <option>Laki-laki</option>
                    <option>Perempuan</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-550 block mb-1">NIK (Opsional)</label>
                <input 
                  type="text" 
                  value={formNik}
                  onChange={(e) => setFormNik(e.target.value)}
                  placeholder="NIK 16 digit"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-500 font-semibold font-mono text-slate-700"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-550 block mb-1">No. HP*</label>
                <input 
                  type="text" 
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="08xx-xxxx-xxxx"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-500 font-semibold text-slate-700"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-550 block mb-1">Alamat Lengkap</label>
                <textarea 
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Masukkan alamat lengkap"
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-500 font-semibold text-slate-700 resize-none"
                />
              </div>

              <div className="flex items-start space-x-2">
                <input 
                  type="checkbox" 
                  checked={formConsent}
                  onChange={(e) => setFormConsent(e.target.checked)}
                  id="consent-check" 
                  className="rounded mt-0.5" 
                />
                <label htmlFor="consent-check" className="text-[9px] text-slate-400 font-semibold leading-relaxed">
                  Saya menyetujui pengumpulan & penggunaan data sesuai dengan <a href="#" className="text-teal-600 hover:underline">Kebijakan Privasi klinik</a>.
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                {editingRm ? (
                  <button 
                    type="button" 
                    onClick={handleCancelEdit}
                    className="border border-slate-200 hover:bg-slate-100 text-slate-650 font-bold text-xs py-2 rounded-xl"
                  >
                    Batal
                  </button>
                ) : (
                  <button 
                    type="button" 
                    onClick={handleClearForm}
                    className="border border-slate-200 hover:bg-slate-50 text-slate-650 font-bold text-xs py-2 rounded-xl"
                  >
                    Bersihkan
                  </button>
                )}
                <button 
                  type="submit" 
                  className="bg-teal-650 hover:bg-teal-700 text-white font-bold text-xs py-2 rounded-xl shadow-sm transition-colors"
                >
                  {editingRm ? "Simpan Perubahan" : "Simpan Pasien"}
                </button>
              </div>
            </form>
          </div>

          {/* AI Duplicate Risk Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4 relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-slate-805 text-sm flex items-center space-x-1.5">
                  <ShieldAlert className="w-4 h-4 text-violet-600" />
                  <span>Risiko Duplikasi Pasien</span>
                </h4>
                <div className="flex items-center space-x-1">
                  <span className="text-[10px] font-bold text-violet-700 bg-violet-50 px-1.5 py-0.2 rounded-md">AI Analyzer</span>
                </div>
              </div>

              {potentialDuplicate ? (
                <>
                  <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-start space-x-2 text-[10px] text-red-800 leading-normal font-semibold animate-pulse">
                    <AlertCircle className="w-4 h-4 text-red-650 flex-shrink-0 mt-0.5" />
                    <span>Perhatian! Pasien dengan nama serupa terdeteksi di database.</span>
                  </div>

                  <p className="text-[10px] text-slate-400 font-semibold">Potensi duplikat dengan data berikut:</p>

                  <div className="border border-red-100 bg-red-50/10 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-slate-800 text-xs">{potentialDuplicate.name}</h5>
                      <p className="text-[10px] text-slate-400 mt-0.5">{potentialDuplicate.rm} • Lahir {potentialDuplicate.dob}</p>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">NIK: {potentialDuplicate.nik}</p>
                    </div>
                    
                    <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="24" cy="24" r="20" stroke="#f1f5f9" strokeWidth="4" fill="transparent" />
                        <circle cx="24" cy="24" r="20" stroke="#ef4444" strokeWidth="4" fill="transparent" strokeDasharray="125.6" strokeDashoffset="12.5" />
                      </svg>
                      <span className="absolute text-[10px] font-extrabold text-red-650">90%</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-[10px] font-semibold text-slate-500">
                    <p className="text-[10px] font-bold text-slate-650 block">Faktor Kemiripan:</p>
                    <div className="flex items-center space-x-1.5"><span className="text-red-500 font-bold">✔</span> <span>Nama serupa setelah normalisasi fonetik</span></div>
                    <div className="flex items-center space-x-1.5"><span className="text-red-500 font-bold">✔</span> <span>No. HP / Data kontak memiliki kecocokan</span></div>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-start space-x-2 text-[10px] text-emerald-800 leading-normal font-semibold">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Nama pasien aman. Tidak ada indikasi duplikasi rekam medis.</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold italic text-center py-6">
                    Silakan isi form pendaftaran. AI akan otomatis memindai duplikasi secara realtime saat Anda mengetik.
                  </p>
                </>
              )}
            </div>

            {potentialDuplicate && (
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-50">
                <button type="button" onClick={() => setFormName("")} className="border border-slate-200 text-slate-650 hover:bg-slate-50 text-[10px] font-bold py-2 rounded-xl">Batal / Ganti</button>
                <button type="button" onClick={() => alert("Abaikan risiko: melanjutkan pembuatan pasien baru.")} className="bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold py-2 rounded-xl transition-colors">Abaikan</button>
              </div>
            )}
          </div>

          {/* Activity Logs of Changes */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-slate-800 text-sm">Aktivitas Perubahan Terbaru</h4>
              <button onClick={() => alert("Menampilkan semua log aktivitas pasien")} className="text-xs font-semibold text-teal-600 hover:underline">Lihat semua</button>
            </div>
            
            <div className="relative pl-4 border-l border-slate-150 space-y-4 py-1 ml-1.5 text-xs text-slate-650">
              {recentActivities.map((act, idx) => (
                <div key={idx} className="relative">
                  <span className={`absolute -left-[20px] top-1 w-2 h-2 rounded-full ${idx === 0 ? "bg-teal-500" : "bg-slate-300"}`}></span>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] font-bold text-slate-400">{act.time}</span>
                      <span className="font-bold text-slate-800">{act.user}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">{act.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Right Column: Patient Detail Sidebar */}
      <div className="w-full lg:w-80 space-y-6">
        {!selectedPatient ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center text-slate-400 space-y-3 font-semibold">
            <Users className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-xs">Tidak ada data pasien untuk ditampilkan. Silakan tambahkan pasien baru.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-5">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-slate-800 text-sm">Detail Pasien</h3>
              <span className="text-[10px] font-mono text-slate-400">#{selectedPatient.rm}</span>
            </div>

          {/* Profile Header Widget */}
          <div className="text-center space-y-2 border-b border-slate-50 pb-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400 font-extrabold text-xl relative shadow-inner">
              {selectedPatient.name.split(" ").map(n => n[0]).join("")}
              {selectedPatient.status === "VIP" && (
                <span className="absolute right-0 bottom-0 bg-yellow-500 text-white w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold">★</span>
              )}
            </div>
            <div>
              <div className="flex items-center justify-center space-x-1.5">
                <h4 className="font-bold text-slate-800 text-sm">{selectedPatient.name}</h4>
                {selectedPatient.status === "VIP" && (
                  <span className="px-1.5 py-0.2 bg-purple-100 text-purple-700 rounded text-[9px] font-extrabold">VIP</span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                {selectedPatient.gender} • {selectedPatient.age} thn ({selectedPatient.dob})
              </p>
              <div className="mt-2.5">
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md text-[10px] font-extrabold">Aktif</span>
              </div>
            </div>
          </div>

          {/* Demographics details */}
          <div className="space-y-2.5 text-xs border-b border-slate-50 pb-4">
            <div className="flex justify-between">
              <span className="text-slate-450 font-semibold">Agama:</span>
              <span className="text-slate-700 font-bold">{selectedPatient.religion}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-455 font-semibold">No. HP:</span>
              <span className="text-slate-750 font-bold">{selectedPatient.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-450 font-semibold">NIK:</span>
              <span className="text-slate-750 font-bold font-mono">{selectedPatient.nik}</span>
            </div>
          </div>

          {/* Section: Alergi & Kondisi Penting */}
          <div className="space-y-2 border-b border-slate-50 pb-4">
            <h5 className="font-bold text-slate-800 text-[11px] flex items-center space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              <span>Alergi & Kondisi Penting</span>
            </h5>
            
            {selectedPatient.allergies.length > 0 ? (
              <div className="bg-red-50 text-red-700 p-2.5 rounded-xl text-xs space-y-1 font-semibold flex items-start space-x-2 border border-red-100">
                <span className="block mt-0.5">⚠️</span>
                <div>
                  <span className="text-[10px] font-bold text-red-800 block">Alergi Obat:</span>
                  <span className="text-[10px]">{selectedPatient.allergies.join(", ")}</span>
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 italic">Tidak ada alergi obat yang diketahui.</p>
            )}

            {selectedPatient.conditions.length > 0 ? (
              <div className="bg-orange-50/70 text-orange-700 p-2.5 rounded-xl text-xs space-y-1 font-semibold flex items-start space-x-2 border border-orange-100">
                <span className="block mt-0.5">ℹ️</span>
                <div>
                  <span className="text-[10px] font-bold text-orange-850 block">Riwayat Penyakit:</span>
                  <span className="text-[10px]">{selectedPatient.conditions.join(", ")}</span>
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 italic">Tidak ada kondisi khusus.</p>
            )}
          </div>

          {/* Section: Asuransi & Pembayaran */}
          <div className="space-y-2.5 text-xs border-b border-slate-50 pb-4">
            <h5 className="font-bold text-slate-800 text-[11px]">Asuransi & Pembayaran</h5>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-450 font-semibold">Asuransi:</span>
              <span className="text-slate-750 font-bold">{selectedPatient.insurance}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-455 font-semibold">No. Kartu:</span>
              <span className="text-slate-750 font-bold">{selectedPatient.insuranceNo}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-450 font-semibold">Tipe Pasien:</span>
              <span className="text-slate-750 font-bold">Umum</span>
            </div>
          </div>

          {/* Section: Emergency Contact */}
          <div className="space-y-2 border-b border-slate-50 pb-4 text-xs">
            <h5 className="font-bold text-slate-800 text-[11px]">Kontak Darurat / Penanggung Jawab</h5>
            <div className="bg-slate-50/50 p-2.5 rounded-xl space-y-1.5 font-semibold">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-450">Nama:</span>
                <span className="text-slate-750 font-bold">{selectedPatient.emergencyContact.name} ({selectedPatient.emergencyContact.relation})</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-450">No. HP:</span>
                <span className="text-slate-750 font-bold">{selectedPatient.emergencyContact.phone}</span>
              </div>
              <div className="text-[10px] text-slate-400 leading-normal border-t border-slate-100 pt-1.5 mt-1">
                <span className="block font-bold">Alamat:</span>
                {selectedPatient.emergencyContact.address}
              </div>
            </div>
          </div>

          {/* Section: Persetujuan & Konsen */}
          <div className="space-y-2 border-b border-slate-50 pb-4 text-xs">
            <h5 className="font-bold text-slate-800 text-[11px]">Persetujuan & Konsen</h5>
            <div className="space-y-1.5 font-semibold">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-450">Persetujuan Umum:</span>
                <span className="flex items-center space-x-1 text-emerald-600">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Disetujui</span>
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-450">Kebijakan Privasi:</span>
                <span className="flex items-center space-x-1 text-emerald-600">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Disetujui</span>
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-450">Penggunaan Data:</span>
                <span className="flex items-center space-x-1 text-orange-650">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Menunggu</span>
                </span>
              </div>
            </div>
          </div>

          {/* Section: Preferensi Komunikasi */}
          <div className="space-y-2 border-b border-slate-50 pb-3 text-xs">
            <h5 className="font-bold text-slate-800 text-[11px]">Preferensi Komunikasi</h5>
            <div className="flex justify-between font-semibold">
              <span className="flex items-center space-x-1 text-emerald-650"><MessageSquare className="w-3.5 h-3.5 text-emerald-500" /> <span className="text-[10px]">WhatsApp Aktif</span></span>
              <span className="flex items-center space-x-1 text-slate-400"><Mail className="w-3.5 h-3.5" /> <span className="text-[10px]">Email Non-aktif</span></span>
              <span className="flex items-center space-x-1 text-emerald-650"><Phone className="w-3.5 h-3.5 text-emerald-500" /> <span className="text-[10px]">Telepon Aktif</span></span>
            </div>
          </div>

          <p className="text-[9px] text-slate-400 text-center italic">
            Dibuat: 20 Jan 2024 oleh apt. Dwi Putri. <br /> Diperbarui: 22 Mei 2025 oleh dr. Maya Lestari
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button 
              onClick={() => startEdit(selectedPatient)}
              className="border border-slate-200 hover:bg-slate-50 text-slate-650 font-bold text-xs py-2.5 rounded-xl"
            >
              Edit Pasien
            </button>
            <button 
              onClick={() => {
                if (onMakeAppointment && selectedPatient) {
                  onMakeAppointment({
                    rm: selectedPatient.rm,
                    name: selectedPatient.name,
                    phone: selectedPatient.phone
                  });
                }
              }}
              className="bg-teal-650 hover:bg-teal-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-sm transition-colors text-center"
            >
              Buat Appointment
            </button>
            <button 
              onClick={() => {
                if (!selectedPatient) return;
                const chosenPoli = prompt(`Daftarkan ${selectedPatient.name} ke Antrean Poli mana?\n\nPilihan: Umum, Gigi, Jantung, Mata, Kulit, Anak`, "Umum");
                if (chosenPoli) {
                  const created = addQueueTicketDirect(selectedPatient, chosenPoli.trim());
                  if (created) {
                    alert(`✓ Berhasil! Pasien ${selectedPatient.name} terdaftar ke Antrean Poli ${chosenPoli} dengan Nomor Tiket ${created.no}`);
                  }
                }
              }}
              className="col-span-2 bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-sm transition-colors text-center mt-1"
            >
              + Masuk Antrean Poli Langsung
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
  );
}
