// Centralized Store & Persistence Layer for AI Clinic Management System

export interface Doctor {
  id: string;
  name: string;
  poli: string;
  sip: string;
  phone: string;
  color: string;
  bg: string;
  status: "Aktif" | "Cuti" | "Nonaktif";
}

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

export interface Appointment {
  id: string;
  patientId?: string;
  name: string;
  phone: string;
  poli: string;
  dokter: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  dur: number; // minutes
  status: "menunggu" | "berjalan" | "selesai" | "dibatalkan";
  notes?: string;
  col?: string;
  bg?: string;
}

export interface QueueItem {
  id: string;
  no: string;
  patientId?: string;
  name: string;
  phone?: string;
  insurance?: string;
  poli: string;
  doctorName?: string;
  status: "menunggu" | "dipanggil" | "selesai" | "dibatalkan";
  wait: string;
  avatar?: string;
  color?: string;
  date?: string;
  createdTime?: string;
}

export interface Encounter {
  id: string;
  patientRm: string;
  patientName: string;
  doctorName: string;
  poli: string;
  date: string;
  status: "berjalan" | "selesai" | "batal";
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  vitalSigns: {
    td: string;
    nadi: string;
    suhu: string;
    rr: string;
    spo2: string;
    bb: string;
  };
  prescription: Array<{ nama: string; dosis: string; jumlah: string | number; harga: number }>;
  labOrders: Array<{ testName: string; notes: string }>;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  details: string;
}

// Initial Doctor List
export const DEFAULT_DOCTORS: Doctor[] = [
  { id: "DOC001", name: "dr. Maya Lestari", poli: "Umum", sip: "SIP-2024-001", phone: "0812-1111-2222", color: "#0d9488", bg: "#e0f2fe", status: "Aktif" },
  { id: "DOC002", name: "drg. Sari Dewi", poli: "Gigi", sip: "SIP-2024-002", phone: "0812-3333-4444", color: "#8b5cf6", bg: "#ede9fe", status: "Aktif" },
  { id: "DOC003", name: "dr. Ahmad Rizki", poli: "Jantung", sip: "SIP-2024-003", phone: "0812-5555-6666", color: "#f97316", bg: "#fff7ed", status: "Aktif" },
  { id: "DOC004", name: "dr. Laila Rahmawati", poli: "Kulit", sip: "SIP-2024-004", phone: "0812-7777-8888", color: "#ec4899", bg: "#fdf2f8", status: "Aktif" },
  { id: "DOC005", name: "dr. Rudi Setiawan", poli: "Anak", sip: "SIP-2024-005", phone: "0812-9999-0000", color: "#22c55e", bg: "#f0fdf4", status: "Aktif" },
  { id: "DOC006", name: "dr. Hendra Kusuma", poli: "Mata", sip: "SIP-2024-006", phone: "0811-2233-4455", color: "#3b82f6", bg: "#eff6ff", status: "Aktif" },
];

// LocalStorage Helper Getters / Setters
export const getStoredDoctors = (): Doctor[] => {
  if (typeof window === "undefined") return DEFAULT_DOCTORS;
  const cached = localStorage.getItem("clinic_doctors_v1");
  if (cached) {
    try { return JSON.parse(cached); } catch (e) {}
  }
  localStorage.setItem("clinic_doctors_v1", JSON.stringify(DEFAULT_DOCTORS));
  return DEFAULT_DOCTORS;
};

export const saveStoredDoctors = (doctors: Doctor[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("clinic_doctors_v1", JSON.stringify(doctors));
};

export const addStoredDoctor = (doctor: Omit<Doctor, "id">): Doctor => {
  const current = getStoredDoctors();
  const newDoc: Doctor = {
    ...doctor,
    id: `DOC${String(current.length + 1).padStart(3, "0")}`
  };
  const updated = [newDoc, ...current];
  saveStoredDoctors(updated);
  logAuditEvent("Tambah Dokter Baru", "Dokter", `Menambahkan dokter ${newDoc.name} (${newDoc.poli})`);
  return newDoc;
};

export const logAuditEvent = (action: string, module: string, details: string) => {
  if (typeof window === "undefined") return;
  try {
    const cached = localStorage.getItem("clinic_audit_logs_v1");
    const logs: AuditLog[] = cached ? JSON.parse(cached) : [];
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newLog: AuditLog = {
      id: `LOG${String(logs.length + 1).padStart(4, "0")}`,
      timestamp: `${now.toLocaleDateString('id-ID')} ${timeStr}`,
      user: "dr. Maya Lestari",
      action,
      module,
      details
    };
    localStorage.setItem("clinic_audit_logs_v1", JSON.stringify([newLog, ...logs.slice(0, 99)]));
  } catch (e) {}
};

// Helper: Auto-complete Queue and Appointment status when Encounter is finalized
export const completePatientEncounterSync = (patientRm: string, patientName: string) => {
  if (typeof window === "undefined") return;
  
  // 1. Update Queue status to 'selesai'
  try {
    const cachedQueue = localStorage.getItem("clinic_queue_v1");
    if (cachedQueue) {
      const queueList: QueueItem[] = JSON.parse(cachedQueue);
      const updatedQueue = queueList.map(q => {
        if ((q.patientId === patientRm || q.name === patientName) && (q.status === "dipanggil" || q.status === "menunggu")) {
          return { ...q, status: "selesai" as const };
        }
        return q;
      });
      localStorage.setItem("clinic_queue_v1", JSON.stringify(updatedQueue));
    }
  } catch (e) {}

  // 2. Update Appointment status to 'selesai'
  try {
    const cachedAppts = localStorage.getItem("clinic_appointments_v1");
    if (cachedAppts) {
      const apptList: Appointment[] = JSON.parse(cachedAppts);
      const updatedAppts = apptList.map(a => {
        if ((a.patientId === patientRm || a.name === patientName) && (a.status === "berjalan" || a.status === "menunggu")) {
          return { ...a, status: "selesai" as const };
        }
        return a;
      });
      localStorage.setItem("clinic_appointments_v1", JSON.stringify(updatedAppts));
    }
  } catch (e) {}
};

// Helper: Auto Push Lab Order from Encounter
export const addLabOrderFromEncounter = (labData: { patientRm: string; patientName: string; doctorName: string; testName: string; notes?: string }) => {
  if (typeof window === "undefined") return;
  try {
    const cachedLab = localStorage.getItem("clinic_lab_v1");
    const labList = cachedLab ? JSON.parse(cachedLab) : [];
    const newLab = {
      id: `LAB${String(labList.length + 1).padStart(3, "0")}`,
      patientName: labData.patientName,
      patientRm: labData.patientRm,
      testName: labData.testName,
      doctorName: labData.doctorName,
      date: new Date().toISOString().split("T")[0],
      status: "menunggu",
      notes: labData.notes || "Order dari Encounter Dokter"
    };
    localStorage.setItem("clinic_lab_v1", JSON.stringify([newLab, ...labList]));
    logAuditEvent("Auto Order Lab", "Laboratorium", `Order lab ${newLab.testName} untuk ${labData.patientName}`);
  } catch (e) {}
};

// Helper: Directly Add Queue Ticket from Patient View
export const addQueueTicketDirect = (patient: { rm: string; name: string; phone?: string; insurance?: string }, poli: string) => {
  if (typeof window === "undefined") return null;
  try {
    const cachedQueue = localStorage.getItem("clinic_queue_v1");
    const queueList: QueueItem[] = cachedQueue ? JSON.parse(cachedQueue) : [];
    
    const poliPrefixes: Record<string, string> = {
      "Umum": "A", "Gigi": "B", "Jantung": "C", "Mata": "D", "Kulit": "E", "Anak": "F"
    };
    const prefix = poliPrefixes[poli] || "A";
    const samePoliCount = queueList.filter(q => q.poli === poli).length + 1;
    const ticketNo = `${prefix}-${String(samePoliCount).padStart(3, "0")}`;

    const newTicket: QueueItem = {
      id: `Q-${Date.now()}`,
      no: ticketNo,
      patientId: patient.rm,
      name: patient.name,
      phone: patient.phone || "",
      insurance: patient.insurance || "Umum / Bayar Sendiri",
      poli,
      status: "menunggu",
      wait: "5-10 menit",
      color: "#0d9488",
      createdTime: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    };

    const updated = [newTicket, ...queueList];
    localStorage.setItem("clinic_queue_v1", JSON.stringify(updated));
    logAuditEvent("Pendaftaran Antrean Poli", "Antrean", `Pendaftaran tiket ${ticketNo} Poli ${poli} untuk ${patient.name}`);
    return newTicket;
  } catch (e) {
    return null;
  }
};

export const resetAllData = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("clinic_patients_v1");
  localStorage.removeItem("clinic_appointments_v1");
  localStorage.removeItem("clinic_queue_v1");
  localStorage.removeItem("clinic_encounters_v1");
  localStorage.removeItem("clinic_pharmacy_v1");
  localStorage.removeItem("clinic_billing_v1");
  localStorage.removeItem("clinic_lab_v1");
  localStorage.removeItem("clinic_audit_logs_v1");
  localStorage.setItem("clinic_doctors_v1", JSON.stringify(DEFAULT_DOCTORS));
  logAuditEvent("Reset System Data", "System", "Seluruh data sampel berhasil dibersihkan");
};
