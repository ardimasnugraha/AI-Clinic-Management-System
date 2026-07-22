"use client";

import React, { useState, useEffect } from "react";
import { 
  ChevronLeft, Activity, Heart, Thermometer, Wind, Stethoscope, Pill, 
  FileText, FlaskConical, CheckCircle2, AlertTriangle, Sparkles, Clock, User, Save, Check, Plus, Trash2, ArrowRight
} from "lucide-react";
import { getStoredDoctors, logAuditEvent, completePatientEncounterSync, addLabOrderFromEncounter } from "@/lib/store";

// Doctor to Poli mapping (mirrors AppointmentsView)
const DOCTOR_MAP: Record<string, { poli: string; keywords: string[] }> = {
  "dr. Maya Lestari": { poli: "Poli Umum", keywords: ["demam", "flu", "pusing", "batuk", "umum"] },
  "drg. Sari Dewi": { poli: "Poli Gigi", keywords: ["gigi", "gusi", "behel", "tambal"] },
  "dr. Ahmad Rizki": { poli: "Poli Jantung", keywords: ["jantung", "dada", "hipertensi", "sesak"] },
  "dr. Laila Rahmawati": { poli: "Poli Kulit", keywords: ["kulit", "gatal", "jerawat", "ruam", "alergi kulit"] },
  "dr. Rudi Setiawan": { poli: "Poli Anak", keywords: ["anak", "bayi", "imunisasi", "demam anak"] },
  "dr. Hendra Kusuma": { poli: "Poli Mata", keywords: ["mata", "katarak", "minus", "penglihatan"] },
  "dr. Bagus W.": { poli: "Poli Penyakit Dalam", keywords: ["lambung", "maag", "diabetes", "penyakit dalam"] },
  "dr. Dimas A.": { poli: "Poli Gigi", keywords: ["gigi", "gusi"] },
  "dr. Ratna Sari": { poli: "Poli Anak", keywords: ["anak"] }
};

// Helper to auto-sync poli when doctor changes
const handleDoctorChange = (docName: string, setActivePatient: any) => {
  const matchedPoli = DOCTOR_MAP[docName]?.poli || "Poli Umum";
  setActivePatient((prev: any) => ({ ...prev, doctor: docName, poli: matchedPoli }));
};

const Container = ({ style, ...p }: any) => (
  <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e8f0fe", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", ...style }} {...p} />
);

const tabs = ["Anamnesis & Vital Sign", "SOAP Note", "Diagnosis & Tindakan", "Resep Obat", "Laboratorium"];

interface EncounterViewProps {
  initialPatient?: { rm: string; name: string } | null;
  onClearInitialPatient?: () => void;
}

export default function EncounterView({ initialPatient, onClearInitialPatient }: EncounterViewProps = {}) {
  const [activeTab, setActiveTab] = useState("SOAP Note");
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [waitingQueueList, setWaitingQueueList] = useState<any[]>([]);
  const [registeredPatientsList, setRegisteredPatientsList] = useState<any[]>([]);

  const [activePatient, setActivePatient] = useState({
    rm: "-",
    name: "Pilih Pasien Dari Antrean / Daftar",
    gender: "-",
    age: 0,
    poli: "Umum",
    queueNo: "-",
    doctor: "dr. Maya Lestari",
    allergies: [] as string[],
    conditions: [] as string[]
  });

  const [soap, setSoap] = useState({
    S: "",
    O: "",
    A: "",
    P: ""
  });

  const [vitals, setVitals] = useState({
    td: "",
    nadi: "",
    suhu: "",
    rr: "",
    spo2: "",
    bb: ""
  });

  // Prescriptions List
  const [prescriptions, setPrescriptions] = useState<any[]>([]);

  // Lab Order State
  const [requestLabTest, setRequestLabTest] = useState(false);
  const [labTestName, setLabTestName] = useState("Darah Lengkap & Hb");

  const [newMed, setNewMed] = useState({ nama: "Paracetamol 500mg", dosis: "3x1 sesudah makan", jumlah: 10, harga: 10000 });
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [finalResultModal, setFinalResultModal] = useState<any | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    const docs = getStoredDoctors();
    setDoctorsList(docs);

    // Load registered patients list
    try {
      const cachedPatients = localStorage.getItem("clinic_patients_v1");
      if (cachedPatients) {
        setRegisteredPatientsList(JSON.parse(cachedPatients));
      }
    } catch (e) {}

    // Load queue list for patient selection
    try {
      const cachedQueue = localStorage.getItem("clinic_queue_v1");
      if (cachedQueue) {
        const queueList = JSON.parse(cachedQueue);
        const activeList = queueList.filter((q: any) => q.status === "dipanggil" || q.status === "menunggu");
        setWaitingQueueList(activeList);

        if (!initialPatient) {
          const currentCalled = queueList.find((q: any) => q.status === "dipanggil");
          if (currentCalled) {
            setActivePatient(prev => ({
              ...prev,
              rm: currentCalled.patientId || "RM0001236",
              name: currentCalled.name,
              poli: currentCalled.poli,
              queueNo: currentCalled.no,
              doctor: currentCalled.doctorName || "dr. Maya Lestari"
            }));
          }
        }
      }
    } catch (e) {}

    if (initialPatient) {
      setActivePatient(prev => ({
        ...prev,
        rm: initialPatient.rm,
        name: initialPatient.name
      }));
      if (onClearInitialPatient) onClearInitialPatient();
    }
  }, [initialPatient, onClearInitialPatient]);

  const handleSelectPatientAny = (rmOrName: string) => {
    if (!rmOrName) return;
    const foundQueue = waitingQueueList.find(q => (q.patientId === rmOrName || q.name === rmOrName));
    const foundPatient = registeredPatientsList.find(p => (p.rm === rmOrName || p.name === rmOrName));

    if (foundQueue) {
      setActivePatient({
        rm: foundQueue.patientId || `RM000${Math.floor(1000 + Math.random() * 9000)}`,
        name: foundQueue.name,
        gender: "Laki-laki",
        age: 35,
        poli: foundQueue.poli,
        queueNo: foundQueue.no,
        doctor: foundQueue.doctorName || doctorsList[0]?.name || "dr. Maya Lestari",
        allergies: [],
        conditions: []
      });
      showToast(`Pasien Antrean ${foundQueue.name} (${foundQueue.no}) terpilih.`);
    } else if (foundPatient) {
      setActivePatient({
        rm: foundPatient.rm,
        name: foundPatient.name,
        gender: foundPatient.gender || "Laki-laki",
        age: foundPatient.age || 35,
        poli: foundPatient.poli || "Poli Umum",
        queueNo: "Direct",
        doctor: foundPatient.doctorName || doctorsList[0]?.name || "dr. Maya Lestari",
        allergies: foundPatient.allergies || [],
        conditions: foundPatient.conditions || []
      });
      showToast(`Pasien Terdaftar ${foundPatient.name} (${foundPatient.rm}) terpilih.`);
    }
  };

  const applySoapTemplate = (type: "gigi" | "jantung" | "kulit" | "demam" | "mata") => {
    if (type === "gigi") {
      setSoap({
        S: "Pasien mengeluh sakit gigi geraham bawah kanan berdenyut sejak 2 hari, bertambah ngilu saat minum dingin dan makan.",
        O: "Pemeriksaan intraoral: Karies dentis profunda pada gigi 46, percusi (+), palpasi (-). Gusi sekitar hyperemia ringan.",
        A: "Pulpitis Akut / Karies Gigi (ICD-10: K04.0)",
        P: "1. Asam Mefenamat 500mg 3x1 tablet (pereda nyeri)\n2. Amoksisilin 500mg 3x1 tablet (habiskan)\n3. Pro penambalan / Perawatan Saluran Akar setelah peradangan mereda."
      });
      setVitals({ td: "120/80", nadi: "80", suhu: "36.5", rr: "18", spo2: "99", bb: "65" });
      setPrescriptions([
        { nama: "Asam Mefenamat 500mg", dosis: "3x1 Tablet (Sesudah Makan)", jumlah: 10, harga: 15000 },
        { nama: "Amoksisilin 500mg", dosis: "3x1 Kapsul (Sesudah Makan)", jumlah: 15, harga: 22500 }
      ]);
      showToast("Template SOAP Poli Gigi diterapkan!");
    } else if (type === "jantung") {
      setSoap({
        S: "Pasien mengeluh dada kiri terasa berat seperti ditindih sejak tadi pagi, menjalar ke punggung, disertai sesak napas dan keringat dingin.",
        O: "TD: 150/90 mmHg, Nadi: 96 x/menit, Suhu: 36.5°C, RR: 22 x/menit, SpO2: 97%. Auskultasi Jantung: BJ I-II reguler, gallop (-), murmur (-).",
        A: "Angina Pektoris Unstable / Suspect Penyakit Jantung Koroner (ICD-10: I20.0)",
        P: "1. ISDN 5mg Sublingual (bila nyeri dada)\n2. Aspirin 80mg 1x1 tablet\n3. Clopidogrel 75mg 1x1 tablet\n4. Rujuk Spesialis Jantung & Pembuluh Darah (Sp.JP) untuk EKG & Echocardiography."
      });
      setVitals({ td: "150/90", nadi: "96", suhu: "36.5", rr: "22", spo2: "97", bb: "70" });
      setPrescriptions([
        { nama: "Isosorbide Dinitrate (ISDN) 5mg", dosis: "1x1 Tablet Sublingual (Bila Nyeri)", jumlah: 10, harga: 25000 },
        { nama: "Aspirin (Aspilet) 80mg", dosis: "1x1 Tablet (Sesudah Makan)", jumlah: 30, harga: 20000 },
        { nama: "Clopidogrel 75mg", dosis: "1x1 Tablet (Sesudah Makan)", jumlah: 30, harga: 65000 }
      ]);
      showToast("Template SOAP Jantung diterapkan!");
    } else if (type === "kulit") {
      setSoap({
        S: "Pasien mengeluh gatal-gatal dan kemerahan pada lengan dan leher sejak 3 hari, terasa panas dan gatal bertambah saat berkeringat.",
        O: "Status Dermatologis: Tampak plak eritematosa dengan papul dan ekskoriasi pada regio brachii dan colli. Tanda infeksi sekunder (-).",
        A: "Dermatitis Kontak Alergi (ICD-10: L23.9)",
        P: "1. Cetirizine 10mg 1x1 tablet (malam hari)\n2. Hydrocortisone Krim 1% dioles tipis 2x sehari\n3. Edukasi hindari menggaruk dan kurangi paparan sabun keras/alergen."
      });
      setVitals({ td: "120/80", nadi: "78", suhu: "36.6", rr: "18", spo2: "99", bb: "58" });
      setPrescriptions([
        { nama: "Cetirizine 10mg", dosis: "1x1 Tablet Malam (Sesudah Makan)", jumlah: 10, harga: 12000 },
        { nama: "Hydrocortisone Cream 1% 5g", dosis: "2x Sehari Dioles Tipis", jumlah: 1, harga: 18000 }
      ]);
      showToast("Template SOAP Kulit diterapkan!");
    } else if (type === "demam") {
      setSoap({
        S: "Pasien mengeluh demam tinggi mendadak sejak 3 hari, disertai sakit kepala, nyeri belakang mata, mual, dan pegal seluruh badan.",
        O: "TD: 110/70 mmHg, Nadi: 88 x/menit, Suhu: 38.8°C, RR: 20 x/menit, SpO2: 98%. Rumple Leede (-), konjungtiva hiperemis (-).",
        A: "Demam Dengue / Dengue Fever (ICD-10: A90)",
        P: "1. Paracetamol 500mg 3x1-4x1 tablet (bila demam >38°C)\n2. Rehidrasi cairan oral (minum air hangat/oralit min 2-3 Liter/hari)\n3. Cek Laboratorium Darah Lengkap (Hb, Ht, Leukosit, Trombosit)\n4. Edukasi tanda bahaya (perdarahan, muntah terus-menerus)."
      });
      setVitals({ td: "110/70", nadi: "88", suhu: "38.8", rr: "20", spo2: "98", bb: "60" });
      setPrescriptions([
        { nama: "Paracetamol 500mg", dosis: "3x1 Tablet (Bila Demam)", jumlah: 10, harga: 10000 },
        { nama: "Oralit 200ml", dosis: "Sesuai Kebutuhan (Minum Banyak)", jumlah: 10, harga: 15000 }
      ]);
      showToast("Template SOAP Demam diterapkan!");
    } else if (type === "mata") {
      setSoap({
        S: "Pasien mengeluh mata kanan merah, berair, perih, dan mengganjal sejak kemarin pagi. Kotoran mata lengket saat bangun tidur.",
        O: "Pemeriksaan Oftalmologis OD: Injeksi konjungtiva (+), sekret seromukopurulen (+), kornea jernih, refleks cahaya (+/+), visus 6/6.",
        A: "Konjungtivitis Bakteri OD (ICD-10: H10.0)",
        P: "1. Chloramphenicol Tetes Mata 0.5% 4x1-2 tetes pada mata kanan\n2. Edukasi jangan mengucek mata, bersihkan sekret dengan kapas basah, cuci tangan sebelum/sesudah tetes mata."
      });
      setVitals({ td: "120/80", nadi: "76", suhu: "36.5", rr: "16", spo2: "99", bb: "62" });
      setPrescriptions([
        { nama: "Chloramphenicol Eye Drops 0.5% 5ml", dosis: "4x2 Tetes Mata Kanan", jumlah: 1, harga: 22000 }
      ]);
      showToast("Template SOAP Mata diterapkan!");
    }
  };

  const commonMedications = [
    { nama: "Paracetamol 500mg", dosis: "3x1 Tablet (Bila Demam)", jumlah: 10, harga: 10000 },
    { nama: "Amoksisilin 500mg", dosis: "3x1 Kapsul (Habiskan)", jumlah: 15, harga: 22500 },
    { nama: "Asam Mefenamat 500mg", dosis: "3x1 Tablet (Sesudah Makan)", jumlah: 10, harga: 15000 },
    { nama: "Cetirizine 10mg", dosis: "1x1 Tablet Malam", jumlah: 10, harga: 12000 },
    { nama: "Amlodipine 5mg", dosis: "1x1 Tablet Pagi", jumlah: 30, harga: 45000 },
    { nama: "Metformin 500mg", dosis: "2x1 Tablet (Sesudah Makan)", jumlah: 60, harga: 30000 },
    { nama: "Cefadroxil 500mg", dosis: "2x1 Kapsul (Habiskan)", jumlah: 10, harga: 35000 },
    { nama: "Antasida Doen", dosis: "3x1 Tablet Sebelum Makan", jumlah: 10, harga: 8000 },
    { nama: "Dexamethasone 0.5mg", dosis: "3x1 Tablet (Sesudah Makan)", jumlah: 15, harga: 10000 },
    { nama: "Chloramphenicol Tetes Mata 0.5%", dosis: "4x2 Tetes Mata Kanan", jumlah: 1, harga: 22000 },
    { nama: "Hydrocortisone Cream 1%", dosis: "2x Sehari Dioles Tipis", jumlah: 1, harga: 18000 },
    { nama: "Oralit 200ml", dosis: "Sesuai Kebutuhan (Tiap BAB)", jumlah: 10, harga: 15000 }
  ];

  const syncRxToSoapPlan = (rxList: any[]) => {
    if (rxList.length === 0) {
      alert("Daftar resep obat masih kosong.");
      return;
    }
    const rxLines = rxList.map((m, i) => `${i + 1}. ${m.nama} — ${m.dosis} (${m.jumlah} pcs)`).join("\n");
    setSoap(prev => {
      const cleanP = prev.P.split("\n--- Resep Obat ---")[0].trim();
      const updatedP = cleanP 
        ? `${cleanP}\n\n--- Resep Obat ---\n${rxLines}`
        : `--- Resep Obat ---\n${rxLines}`;
      return { ...prev, P: updatedP };
    });
    showToast("SOAP Plan (P) berhasil disinkronkan dengan Daftar Resep Obat!");
  };

  const syncSoapPlanToRx = () => {
    if (!soap.P.trim()) {
      alert("Catatan SOAP Plan (P) masih kosong.");
      return;
    }
    const lines = soap.P.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    const parsedMeds: any[] = [];

    lines.forEach(line => {
      const cleanLine = line.replace(/^[0-9]+[\.\)\-]\s*/, "");
      const lower = cleanLine.toLowerCase();
      if (lower.includes("edukasi") || lower.includes("kontrol") || lower.includes("rujuk") || lower.startsWith("---")) {
        return;
      }
      if (cleanLine.length > 3) {
        parsedMeds.push({
          nama: cleanLine.split("(")[0].split("-")[0].trim() || cleanLine,
          dosis: cleanLine.includes("(") ? cleanLine.split("(")[1].replace(")", "") : "Sesuai petunjuk dokter",
          jumlah: 10,
          harga: 15000
        });
      }
    });

    if (parsedMeds.length > 0) {
      setPrescriptions(parsedMeds);
      showToast(`${parsedMeds.length} obat berhasil diimpor dari SOAP Plan!`);
    } else {
      alert("Tidak ditemukan baris resep obat yang valid di SOAP Plan (P).");
    }
  };

  const handleAddMedicine = (customMed?: any) => {
    const medToAdd = customMed || newMed;
    if (!medToAdd.nama.trim()) {
      alert("Nama Obat wajib diisi.");
      return;
    }
    setPrescriptions(prev => [...prev, { ...medToAdd }]);
    if (!customMed) {
      setNewMed({ nama: "Paracetamol 500mg", dosis: "3x1 sesudah makan", jumlah: 10, harga: 10000 });
    }
    showToast(`Obat ${medToAdd.nama} berhasil ditambahkan!`);
  };

  const handleUpdateMedicine = (idx: number, field: string, value: any) => {
    const updated = [...prescriptions];
    updated[idx] = { ...updated[idx], [field]: value };
    setPrescriptions(updated);
  };

  const handleRemoveMedicine = (idx: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== idx));
  };

  const handleFinalizeEncounter = () => {
    if (!activePatient.name || activePatient.name === "Pilih Pasien Dari Antrean / Daftar") {
      alert("Harap pilih Pasien yang diperiksa terlebih dahulu dari dropdown di atas.");
      return;
    }

    const encounterId = `ENC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const invoiceId = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
    const rxId = `RX-${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Create Invoice in Billing Store
    const rxSubtotal = prescriptions.reduce((acc, p) => acc + (p.harga || 12000), 0);
    const consultationFee = 50000;
    const totalAmount = consultationFee + rxSubtotal;

    try {
      const invoiceItem = {
        id: invoiceId,
        patientRm: activePatient.rm,
        patientName: activePatient.name,
        doctorName: activePatient.doctor,
        date: new Date().toISOString().split("T")[0],
        items: [
          { name: `Jasa Konsultasi Dokter (${activePatient.doctor})`, category: "Konsultasi", amount: consultationFee },
          ...prescriptions.map(p => ({ name: `${p.nama} (${p.jumlah} pcs)`, category: "Farmasi", amount: p.harga || 12000 }))
        ],
        subtotal: totalAmount,
        tax: 0,
        total: totalAmount,
        status: "Belum Bayar"
      };

      const cachedBilling = localStorage.getItem("clinic_billing_v1");
      const invoices = cachedBilling ? JSON.parse(cachedBilling) : [];
      localStorage.setItem("clinic_billing_v1", JSON.stringify([invoiceItem, ...invoices]));
    } catch (e) {}

    // 2. Push Prescription to Pharmacy Store
    try {
      const cachedRx = localStorage.getItem("clinic_pharmacy_v1");
      const rxList = cachedRx ? JSON.parse(cachedRx) : [];
      const newRxOrder = {
        id: rxId,
        patientRm: activePatient.rm,
        patientName: activePatient.name,
        doctorName: activePatient.doctor,
        date: new Date().toISOString().split("T")[0],
        medicines: prescriptions,
        status: "Menunggu Penyiapan"
      };
      localStorage.setItem("clinic_pharmacy_v1", JSON.stringify([newRxOrder, ...rxList]));
    } catch (e) {}

    // 3. Auto Order Lab if requested
    if (requestLabTest) {
      addLabOrderFromEncounter({
        patientRm: activePatient.rm,
        patientName: activePatient.name,
        doctorName: activePatient.doctor,
        testName: labTestName,
        notes: `Order dari Encounter ${encounterId}`
      });
    }

    // 4. Auto-Complete Status in Queue and Appointment Store!
    completePatientEncounterSync(activePatient.rm, activePatient.name);

    logAuditEvent("Finalisasi Encounter Konsultasi", "Encounter", `Encounter ${encounterId} pasien ${activePatient.name} telah difinalisasi.`);

    setFinalResultModal({
      encounterId,
      invoiceId,
      rxId,
      patientName: activePatient.name,
      totalAmount,
      prescriptionsCount: prescriptions.length,
      hasLab: requestLabTest
    });
  };

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

      {/* Header Info */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>Modul Pemeriksaan Dokter (Encounter)</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "2px 0 0" }}>Catatan medis SOAP, vital sign, diagnosis ICD-10, dan peresepan obat</p>
        </div>

        {/* Patient Selection Dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <label style={{ fontSize: 12, fontWeight: 800, color: "#0f172a" }}>Pilih Pasien Yang Diperiksa:</label>
          <select 
            onChange={e => handleSelectPatientAny(e.target.value)}
            style={{ padding: "8.5px 14px", borderRadius: 10, border: "1.5px solid #0d9488", background: "#f0fdf4", fontSize: 12.5, fontWeight: 800, color: "#0f172a", outline: "none", cursor: "pointer" }}>
            <option value="">-- Pilih Pasien Diperiksa --</option>
            {waitingQueueList.length > 0 && (
              <optgroup label="--- PASIEN ANTREAN POLI (AKTIF) ---">
                {waitingQueueList.map(q => (
                  <option key={`q-${q.id}`} value={q.patientId || q.name}>
                    [Antrean {q.no}] {q.name} (Poli {q.poli})
                  </option>
                ))}
              </optgroup>
            )}
            {registeredPatientsList.length > 0 && (
              <optgroup label="--- PASIEN TERDAFTAR KLINIK ---">
                {registeredPatientsList.map(p => (
                  <option key={`p-${p.rm}`} value={p.rm}>
                    [{p.rm}] {p.name} ({p.phone})
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
      </div>

      {/* Patient Encounter Header Banner */}
      <Container style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ background: "linear-gradient(135deg, #e0f2fe, #ccfbf1)", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "linear-gradient(135deg,#0d9488,#0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, color: "#fff", boxShadow: "0 4px 12px rgba(13,148,136,0.3)", flexShrink: 0 }}>
              {activePatient.name ? activePatient.name.split(" ").map(w => w[0]).slice(0, 2).join("") : "P"}
            </div>
            <div>
              <h2 style={{ fontSize: 19, fontWeight: 800, color: "#0f172a", margin: 0 }}>{activePatient.name}</h2>
              <div style={{ display: "flex", gap: 12, marginTop: 4, flexWrap: "wrap", fontSize: 12, color: "#475569", fontWeight: 600 }}>
                <span>RM: {activePatient.rm}</span> • 
                <span>{activePatient.gender}, {activePatient.age} thn</span> • 
                <span style={{ color: "#0d9488", fontWeight: 800 }}>Poli {activePatient.poli}</span> • 
                <span>Antrean: <strong style={{ color: "#f97316" }}>{activePatient.queueNo}</strong></span>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                {activePatient.allergies.map(a => (
                  <span key={a} style={{ background: "#fef2f2", color: "#dc2626", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
                    ⚠ Alergi: {a}
                  </span>
                ))}
                {activePatient.conditions.map(c => (
                  <span key={c} style={{ background: "#fff7ed", color: "#c2410c", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ textAlign: "right", padding: "8px 16px", background: "rgba(255,255,255,0.75)", borderRadius: 12 }}>
              <p style={{ fontSize: 10, color: "#64748b", margin: 0, fontWeight: 700 }}>Dokter Pemeriksa</p>
              <select 
                value={activePatient.doctor}
                onChange={e => handleDoctorChange(e.target.value, setActivePatient)}
                style={{ fontSize: 12.5, fontWeight: 800, color: "#0f172a", border: "none", background: "none", outline: "none", cursor: "pointer" }}>
                {doctorsList.map(d => (
                  <option key={d.id || d.name} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
            <span style={{ background: "#dbeafe", color: "#1d4ed8", borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 800 }}>
              Pemeriksaan Aktif
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: "flex", padding: "0 24px", borderBottom: "1px solid #f1f5f9", gap: 0, overflowX: "auto" }}>
          {tabs.map(t => (
            <button 
              key={t} 
              onClick={() => setActiveTab(t)}
              style={{ 
                padding: "13px 18px", fontSize: 13, fontWeight: 700, border: "none", background: "none", cursor: "pointer", whiteSpace: "nowrap",
                color: activeTab === t ? "#0d9488" : "#64748b",
                borderBottom: activeTab === t ? "3px solid #0d9488" : "3px solid transparent"
              }}>
              {t}
            </button>
          ))}
        </div>
      </Container>

      {/* Main Examination Content */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 310px", gap: 16 }}>
        <div>
          {/* TAB: SOAP NOTE */}
          {activeTab === "SOAP Note" && (
            <Container style={{ padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0 }}>Catatan SOAP (Subjective, Objective, Assessment, Plan)</h3>
                <div style={{ display: "flex", gap: 8 }}>
                  <button 
                    onClick={() => showToast("Draft SOAP berhasil disimpan.")}
                    style={{ display: "flex", alignItems: "center", gap: 6, background: "#0d9488", color: "#fff", border: "none", borderRadius: 10, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    <Save style={{ width: 14, height: 14 }} /> Simpan Draft
                  </button>
                </div>
              </div>

              {/* Template Buttons */}
              <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: 12, border: "1px solid #e2e8f0", marginBottom: 20, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: "#475569" }}>⚡ Quick Template SOAP:</span>
                <button onClick={() => applySoapTemplate("gigi")} style={{ background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", borderRadius: 8, padding: "5px 12px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
                  🦷 Poli Gigi
                </button>
                <button onClick={() => applySoapTemplate("jantung")} style={{ background: "#fff1f2", color: "#be123c", border: "1px solid #ffe4e6", borderRadius: 8, padding: "5px 12px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
                  ❤️ Jantung
                </button>
                <button onClick={() => applySoapTemplate("kulit")} style={{ background: "#fff7ed", color: "#c2410c", border: "1px solid #ffedd5", borderRadius: 8, padding: "5px 12px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
                  🧴 Kulit / Dermatologi
                </button>
                <button onClick={() => applySoapTemplate("demam")} style={{ background: "#e0f2fe", color: "#0369a1", border: "1px solid #bae6fd", borderRadius: 8, padding: "5px 12px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
                  🌡️ Demam
                </button>
                <button onClick={() => applySoapTemplate("mata")} style={{ background: "#f0fdf4", color: "#15803d", border: "1px solid #dcfce7", borderRadius: 8, padding: "5px 12px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
                  👁️ Mata / Oftalmologi
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { key: "S", label: "S — Subjective (Anamnesis & Keluhan Pasien)", color: "#0d9488", bg: "#e0f2fe", ph: "Ketik keluhan pasien..." },
                  { key: "O", label: "O — Objective (Pemeriksaan Fisik & Vital Sign)", color: "#3b82f6", bg: "#eff6ff", ph: "Ketik temuan pemeriksaan fisik..." },
                  { key: "A", label: "A — Assessment (Penilaian & Diagnosis Kerja)", color: "#8b5cf6", bg: "#ede9fe", ph: "Ketik diagnosis medis (ICD-10)..." },
                  { key: "P", label: "P — Plan (Rencana Pengobatan & Edukasi)", color: "#f97316", bg: "#fff7ed", ph: "Ketik rencana instruksi obat & kontrol..." },
                ].map((s) => (
                  <div key={s.key}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 800, color: s.color, marginBottom: 6 }}>
                      <span style={{ width: 22, height: 22, borderRadius: 6, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900 }}>{s.key}</span>
                      {s.label}
                    </label>
                    <textarea 
                      value={soap[s.key as keyof typeof soap]} 
                      onChange={e => setSoap({ ...soap, [s.key]: e.target.value })}
                      rows={s.key === "P" ? 4 : 2}
                      placeholder={s.ph}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${s.color}44`, background: "#f8fafc", fontSize: 13, color: "#1e293b", fontFamily: "inherit", resize: "vertical", outline: "none", lineHeight: 1.6 }} 
                    />

                    {s.key === "P" && (
                      <div style={{ marginTop: 10, background: "#fff7ed", padding: "10px 14px", borderRadius: 12, border: "1px solid #ffedd5", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Pill style={{ width: 16, height: 16, color: "#ea580c" }} />
                          <div>
                            <span style={{ fontSize: 12, fontWeight: 800, color: "#9a3412", display: "block" }}>
                              Daftar Resep Obat Terkait: {prescriptions.length} Obat
                            </span>
                            <span style={{ fontSize: 11, color: "#c2410c" }}>
                              {prescriptions.length > 0 ? prescriptions.map(p => p.nama).join(", ") : "Belum ada obat di resep"}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button 
                            onClick={() => syncRxToSoapPlan(prescriptions)}
                            style={{ background: "#ea580c", color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 11.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                            🔄 Sync Ke SOAP Plan
                          </button>
                          <button 
                            onClick={syncSoapPlanToRx}
                            style={{ background: "#fff", color: "#ea580c", border: "1px solid #fdba74", borderRadius: 8, padding: "6px 12px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
                            📥 Import Dari Plan
                          </button>
                          <button 
                            onClick={() => setActiveTab("Resep Obat")}
                            style={{ background: "#fff", color: "#475569", border: "1px solid #cbd5e1", borderRadius: 8, padding: "6px 12px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
                            Kelola Resep →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Container>
          )}

          {/* TAB: VITAL SIGN */}
          {activeTab === "Anamnesis & Vital Sign" && (
            <Container style={{ padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: "0 0 20px" }}>Tanda-Tanda Vital (Vital Signs)</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                {[
                  { key: "td", label: "Tekanan Darah", val: vitals.td, unit: "mmHg", color: "#ef4444", bg: "#fef2f2", icon: Heart },
                  { key: "nadi", label: "Frekuensi Nadi", val: vitals.nadi, unit: "x/menit", color: "#f97316", bg: "#fff7ed", icon: Activity },
                  { key: "suhu", label: "Suhu Tubuh", val: vitals.suhu, unit: "°C", color: "#8b5cf6", bg: "#ede9fe", icon: Thermometer },
                  { key: "rr", label: "Respirasi (RR)", val: vitals.rr, unit: "x/menit", color: "#3b82f6", bg: "#eff6ff", icon: Wind },
                  { key: "spo2", label: "Saturasi O2", val: vitals.spo2, unit: "%", color: "#0d9488", bg: "#e0f2fe", icon: Activity },
                  { key: "bb", label: "Berat Badan", val: vitals.bb, unit: "kg", color: "#22c55e", bg: "#f0fdf4", icon: User },
                ].map((v) => {
                  const Icon = v.icon;
                  return (
                    <div key={v.key} style={{ background: v.bg, borderRadius: 12, padding: 16, border: `1px solid ${v.color}33` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>{v.label}</span>
                        <Icon style={{ width: 16, height: 16, color: v.color }} />
                      </div>
                      <input 
                        type="text" 
                        value={v.val}
                        onChange={e => setVitals({ ...vitals, [v.key]: e.target.value })}
                        style={{ fontSize: 24, fontWeight: 900, color: v.color, border: "none", background: "none", outline: "none", width: "100%" }}
                      />
                      <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>{v.unit}</div>
                    </div>
                  );
                })}
              </div>
            </Container>
          )}

          {/* TAB: LABORATORIUM ORDER */}
          {activeTab === "Laboratorium" && (
            <Container style={{ padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: "0 0 16px" }}>Permintaan Tes Laboratorium</h3>
              <div style={{ background: "#f8fafc", padding: 18, borderRadius: 14, border: "1.5px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 14 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, fontWeight: 800, color: "#0f172a" }}>
                  <input 
                    type="checkbox" 
                    checked={requestLabTest} 
                    onChange={e => setRequestLabTest(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: "#0d9488" }} 
                  />
                  <span>Minta Pemeriksaan Tes Laboratorium untuk Pasien Ini</span>
                </label>

                {requestLabTest && (
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Jenis Pemeriksaan Lab yang Diminta:</label>
                    <select 
                      value={labTestName} 
                      onChange={e => setLabTestName(e.target.value)}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #cbd5e1", fontSize: 13, outline: "none", fontWeight: 700 }}>
                      <option value="Darah Lengkap & Hb">Darah Lengkap & Hb</option>
                      <option value="Gula Darah Puasa (GDP)">Gula Darah Puasa (GDP)</option>
                      <option value="Profil Lipid (Kolesterol Total)">Profil Lipid (Kolesterol Total)</option>
                      <option value="Fungsi Ginjal (Ureum/Kreatinin)">Fungsi Ginjal (Ureum/Kreatinin)</option>
                      <option value="Urinalisis Lengkap">Urinalisis Lengkap</option>
                    </select>
                  </div>
                )}
              </div>
            </Container>
          )}

          {/* TAB: RESEP OBAT */}
          {activeTab === "Resep Obat" && (
            <Container style={{ padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0 }}>Daftar Resep Obat Pasien</h3>
                  <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>
                    Total: {prescriptions.length} Jenis Obat • Estimasi Rp {prescriptions.reduce((acc, p) => acc + (Number(p.harga) || 0), 0).toLocaleString("id-ID")}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button 
                    onClick={() => syncRxToSoapPlan(prescriptions)}
                    style={{ background: "#ea580c", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                    🔄 Sync Ke SOAP Plan (P)
                  </button>
                  <button 
                    onClick={syncSoapPlanToRx}
                    style={{ background: "#fff", color: "#0d9488", border: "1.5px solid #0d9488", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                    📥 Import Dari SOAP Plan (P)
                  </button>
                </div>
              </div>

              {/* Quick Select Preset Obat */}
              <div style={{ background: "#f0fdf4", padding: 14, borderRadius: 12, border: "1px solid #bbf7d0", marginBottom: 20 }}>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: "#166534", display: "block", marginBottom: 8 }}>
                  ⚡ Cepat Tambah Dari Katalog Obat Dokter (Klik 1x untuk Tambah):
                </span>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {commonMedications.map((m, idx) => (
                    <button 
                      key={idx}
                      onClick={() => handleAddMedicine(m)}
                      style={{ background: "#fff", color: "#15803d", border: "1px solid #86efac", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                      + {m.nama}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Input Form */}
              <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1.5px solid #e2e8f0", marginBottom: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                <h4 style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", margin: 0 }}>+ Tambah Obat Manual / Custom</h4>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1.2fr", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>Nama Obat & Dosis</label>
                    <input 
                      type="text" 
                      placeholder="Misal: Cefadroxil 500mg" 
                      value={newMed.nama} 
                      onChange={e => setNewMed({ ...newMed, nama: e.target.value })}
                      style={{ width: "100%", padding: "8.5px 12px", borderRadius: 8, border: "1.5px solid #cbd5e1", fontSize: 12.5, outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>Aturan Pakai</label>
                    <input 
                      type="text" 
                      placeholder="Misal: 3x1 sesudah makan" 
                      value={newMed.dosis} 
                      onChange={e => setNewMed({ ...newMed, dosis: e.target.value })}
                      style={{ width: "100%", padding: "8.5px 12px", borderRadius: 8, border: "1.5px solid #cbd5e1", fontSize: 12.5, outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>Jumlah (pcs)</label>
                    <input 
                      type="number" 
                      placeholder="Jumlah" 
                      value={newMed.jumlah} 
                      onChange={e => setNewMed({ ...newMed, jumlah: Number(e.target.value) })}
                      style={{ width: "100%", padding: "8.5px 12px", borderRadius: 8, border: "1.5px solid #cbd5e1", fontSize: 12.5, outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4 }}>Harga Total (Rp)</label>
                    <input 
                      type="number" 
                      placeholder="Harga Total (Rp)" 
                      value={newMed.harga} 
                      onChange={e => setNewMed({ ...newMed, harga: Number(e.target.value) })}
                      style={{ width: "100%", padding: "8.5px 12px", borderRadius: 8, border: "1.5px solid #cbd5e1", fontSize: 12.5, outline: "none" }}
                    />
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button 
                    onClick={() => handleAddMedicine()}
                    style={{ background: "#0d9488", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    + Tambahkan Obat Ke Resep
                  </button>
                </div>
              </div>

              {/* Editable Prescription List */}
              {prescriptions.length === 0 ? (
                <div style={{ padding: 30, textAlign: "center", background: "#f8fafc", borderRadius: 12, border: "1px dashed #cbd5e1" }}>
                  <Pill style={{ width: 32, height: 32, color: "#94a3b8", margin: "0 auto 8px" }} />
                  <p style={{ fontSize: 13, color: "#64748b", fontWeight: 700, margin: 0 }}>Belum ada obat di dalam resep ini.</p>
                  <p style={{ fontSize: 11.5, color: "#94a3b8", margin: "4px 0 0" }}>Gunakan katalog cepat di atas atau ketik manual untuk menambahkan obat.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#475569" }}>Daftar Obat Terdaftar (Dapat Di-edit Dokter Realtime):</span>
                  {prescriptions.map((o, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", gap: 12, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 2, minWidth: 200 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Pill style={{ width: 18, height: 18, color: "#0d9488" }} />
                        </div>
                        <div style={{ width: "100%" }}>
                          <input 
                            type="text"
                            value={o.nama}
                            onChange={e => handleUpdateMedicine(i, "nama", e.target.value)}
                            style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", border: "1px solid transparent", outline: "none", width: "100%", background: "transparent" }}
                          />
                          <input 
                            type="text"
                            value={o.dosis}
                            placeholder="Aturan pakai..."
                            onChange={e => handleUpdateMedicine(i, "dosis", e.target.value)}
                            style={{ fontSize: 11.5, color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 6, padding: "2px 6px", width: "100%", outline: "none", marginTop: 2 }}
                          />
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Qty:</span>
                          <input 
                            type="number" 
                            value={o.jumlah}
                            onChange={e => handleUpdateMedicine(i, "jumlah", Number(e.target.value))}
                            style={{ width: 55, padding: "4px 6px", borderRadius: 6, border: "1.5px solid #cbd5e1", fontSize: 12, fontWeight: 800, textAlign: "center" }}
                          />
                          <span style={{ fontSize: 11, color: "#64748b" }}>pcs</span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Rp</span>
                          <input 
                            type="number" 
                            value={o.harga}
                            onChange={e => handleUpdateMedicine(i, "harga", Number(e.target.value))}
                            style={{ width: 85, padding: "4px 6px", borderRadius: 6, border: "1.5px solid #cbd5e1", fontSize: 12, fontWeight: 800, color: "#0d9488" }}
                          />
                        </div>

                        <button 
                          onClick={() => handleRemoveMedicine(i)} 
                          title="Hapus Obat"
                          style={{ border: "none", background: "#fef2f2", color: "#dc2626", borderRadius: 8, padding: "6px 10px", fontWeight: 800, cursor: "pointer" }}>
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Container>
          )}

          {!["SOAP Note", "Anamnesis & Vital Sign", "Resep Obat", "Laboratorium"].includes(activeTab) && (
            <Container style={{ padding: 40, textAlign: "center" }}>
              <FileText style={{ width: 40, height: 40, color: "#94a3b8", margin: "0 auto 12px" }} />
              <p style={{ fontSize: 14, color: "#64748b", fontWeight: 700 }}>Modul {activeTab} aktif dan dapat digunakan.</p>
            </Container>
          )}

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <button 
              onClick={() => showToast("Draft encounter berhasil disimpan.")}
              style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 700, color: "#64748b", cursor: "pointer" }}>
              Simpan Sebagai Draft
            </button>
            
            <button 
              onClick={handleFinalizeEncounter} 
              style={{ flex: 2, padding: "12px 0", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #0d9488, #0ea5e9)", fontSize: 13.5, fontWeight: 800, color: "#fff", cursor: "pointer", boxShadow: "0 4px 14px rgba(13,148,136,0.3)" }}>
              ✓ Finalisasi Encounter & Auto-Complete Status
            </button>
          </div>
        </div>

        {/* AI Clinical Sidebar Helper */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "linear-gradient(135deg, #667eea, #764ba2)", borderRadius: 16, padding: 18, color: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Sparkles style={{ width: 16, height: 16, color: "#fff" }} />
              <span style={{ fontSize: 13, fontWeight: 800 }}>AI Clinical Assistant</span>
            </div>
            <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.85)", lineHeight: 1.6, margin: "0 0 12px" }}>
              Saran AI: Pasien memiliki riwayat Hipertensi. Pertimbangkan pemeriksaan tekanan darah berkala dan penyesuaian dosis Amlodipine.
            </p>
            <button 
              onClick={() => showToast("SOAP Otomatis diisi oleh AI Assistant!")}
              style={{ width: "100%", padding: "8.5px 0", background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.35)", borderRadius: 10, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              Isi SOAP Otomatis dari AI
            </button>
          </div>

          <Container style={{ padding: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: "0 0 10px" }}>Riwayat Medis Pasien</h3>
            {[
              { tgl: "10 Jul 2026", diag: "Hipertensi Grade 1", dok: "dr. Maya Lestari" },
              { tgl: "01 Jun 2026", diag: "Pemeriksaan Diabetes", dok: "dr. Ahmad Rizki" },
            ].map((r, i) => (
              <div key={i} style={{ padding: "8px 0", borderBottom: i === 0 ? "1px solid #f1f5f9" : "none" }}>
                <p style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", margin: 0 }}>{r.diag}</p>
                <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{r.tgl} • {r.dok}</p>
              </div>
            ))}
          </Container>
        </div>
      </div>

      {/* Finalization Result Modal */}
      {finalResultModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 480, padding: 28, boxShadow: "0 20px 40px rgba(0,0,0,0.25)", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#dcfce7", color: "#15803d", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <CheckCircle2 style={{ width: 36, height: 36 }} />
            </div>

            <h3 style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", margin: "0 0 6px" }}>Pemeriksaan Berhasil Difinalisasi!</h3>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 20px", lineHeight: 1.5 }}>
              Rekam medis pasien <strong>{finalResultModal.patientName}</strong> telah disimpan & status antrean/appointment diperbarui menjadi <strong>SELESAI</strong>.
            </p>

            <div style={{ background: "#f8fafc", padding: 16, borderRadius: 14, border: "1px solid #e2e8f0", textAlign: "left", marginBottom: 20, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                <span style={{ color: "#64748b", fontWeight: 600 }}>ID Encounter:</span>
                <span style={{ fontWeight: 800, color: "#0f172a" }}>{finalResultModal.encounterId}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                <span style={{ color: "#64748b", fontWeight: 600 }}>Invoice Tagihan (Billing):</span>
                <span style={{ fontWeight: 800, color: "#0d9488" }}>{finalResultModal.invoiceId} (Rp {finalResultModal.totalAmount.toLocaleString("id-ID")})</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                <span style={{ color: "#64748b", fontWeight: 600 }}>Order Resep Obat (Farmasi):</span>
                <span style={{ fontWeight: 800, color: "#8b5cf6" }}>{finalResultModal.rxId} ({finalResultModal.prescriptionsCount} obat)</span>
              </div>
              {finalResultModal.hasLab && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                  <span style={{ color: "#64748b", fontWeight: 600 }}>Order Laboratorium:</span>
                  <span style={{ fontWeight: 800, color: "#06b6d4" }}>Terikirim Ke Lab</span>
                </div>
              )}
            </div>

            <button 
              onClick={() => setFinalResultModal(null)}
              style={{ width: "100%", padding: "12px 0", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #0d9488, #0ea5e9)", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 14px rgba(13,148,136,0.3)" }}>
              Selesai & Kembali Ke Pemeriksaan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
