// Centralized Store & Supabase Persistence Layer for AI Clinic Management System
import { supabase } from "@/lib/supabase/client";

export interface Doctor {
  id: string;
  name: string;
  poli: string;
  sip: string;
  phone: string;
  color: string;
  bg?: string;
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

// Clean helper: Get doctors directly from Supabase / Local cache fallback
export const getStoredDoctors = (): Doctor[] => {
  if (typeof window === "undefined") return [];
  const cached = localStorage.getItem("clinic_doctors_v1");
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {}
  }
  return [];
};

export const saveStoredDoctors = (doctors: Doctor[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("clinic_doctors_v1", JSON.stringify(doctors));
};

export const addStoredDoctor = async (doctor: Omit<Doctor, "id">): Promise<Doctor> => {
  const current = getStoredDoctors();
  const nextDocId = `DOC${String(current.length + 1).padStart(3, "0")}`;
  const newDoc: Doctor = {
    ...doctor,
    id: nextDocId
  };

  try {
    await supabase.from("doctor_profiles").insert([{
      clinic_id: "11111111-1111-1111-1111-111111111111",
      doctor_id: nextDocId,
      full_name: newDoc.name,
      poli: newDoc.poli,
      sip: newDoc.sip,
      phone: newDoc.phone,
      color: newDoc.color,
      status: newDoc.status
    }]);
  } catch (e) {
    console.warn("Failed inserting doctor into Supabase", e);
  }

  const updated = [newDoc, ...current];
  saveStoredDoctors(updated);
  logAuditEvent("Tambah Dokter Baru", "Dokter", `Menambahkan dokter ${newDoc.name} (${newDoc.poli})`);
  return newDoc;
};

// Log audit event to Supabase & LocalStorage cache
export const logAuditEvent = async (action: string, module: string, details: string, user: string = "dr. Maya Lestari") => {
  if (typeof window === "undefined") return;
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const timestampStr = `${now.toLocaleDateString("id-ID")} ${timeStr}`;
  
  const newLog: AuditLog = {
    id: `LOG${String(Date.now()).slice(-6)}`,
    timestamp: timestampStr,
    user,
    action,
    module,
    details
  };

  // Sync to Supabase audit_logs
  try {
    await supabase.from("audit_logs").insert([{
      clinic_id: "11111111-1111-1111-1111-111111111111",
      actor_role: user,
      action: `${action} [${module}]`,
      resource_type: module,
      metadata: { details, user, timestamp: timestampStr }
    }]);
  } catch (e) {}

  // Sync to LocalStorage cache
  try {
    const cached = localStorage.getItem("clinic_audit_logs_v1");
    const logs: AuditLog[] = cached ? JSON.parse(cached) : [];
    localStorage.setItem("clinic_audit_logs_v1", JSON.stringify([newLog, ...logs.slice(0, 99)]));
  } catch (e) {}
};

// Helper: Auto-complete Queue and Appointment status when Encounter is finalized
export const completePatientEncounterSync = async (patientRm: string, patientName: string) => {
  if (typeof window === "undefined") return;
  
  // 1. Update Supabase & LocalStorage Queue status to 'selesai'
  try {
    await supabase.from("queues").update({ status: "selesai" }).or(`patient_name.eq.${patientName},patient_id.eq.${patientRm}`);
  } catch (e) {}

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

  // 2. Update Supabase & LocalStorage Appointment status to 'selesai'
  try {
    await supabase.from("appointments").update({ status: "Selesai" }).or(`patient_id.eq.${patientRm}`);
  } catch (e) {}

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
export const addLabOrderFromEncounter = async (labData: { patientRm: string; patientName: string; doctorName: string; testName: string; notes?: string }) => {
  if (typeof window === "undefined") return;
  const labId = `LAB${String(Date.now()).slice(-4)}`;
  const dateStr = new Date().toISOString().split("T")[0];

  // Save to Supabase
  try {
    await supabase.from("lab_orders").insert([{
      clinic_id: "11111111-1111-1111-1111-111111111111",
      lab_no: labId,
      patient_rm: labData.patientRm,
      patient_name: labData.patientName,
      doctor_name: labData.doctorName,
      test_name: labData.testName,
      date: dateStr,
      status: "menunggu",
      notes: labData.notes || "Order dari Encounter Dokter"
    }]);
  } catch (e) {}

  // Save to LocalStorage cache
  try {
    const cachedLab = localStorage.getItem("clinic_lab_v1");
    const labList = cachedLab ? JSON.parse(cachedLab) : [];
    const newLab = {
      id: labId,
      patientName: labData.patientName,
      patientRm: labData.patientRm,
      testName: labData.testName,
      doctorName: labData.doctorName,
      date: dateStr,
      status: "menunggu",
      notes: labData.notes || "Order dari Encounter Dokter"
    };
    localStorage.setItem("clinic_lab_v1", JSON.stringify([newLab, ...labList]));
    logAuditEvent("Auto Order Lab", "Laboratorium", `Order lab ${newLab.testName} untuk ${labData.patientName}`);
  } catch (e) {}
};

// Helper: Directly Add Queue Ticket from Patient View
export const addQueueTicketDirect = async (patient: { rm: string; name: string; phone?: string; insurance?: string }, poli: string) => {
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

    // Push to Supabase
    try {
      await supabase.from("queues").insert([{
        clinic_id: "11111111-1111-1111-1111-111111111111",
        ticket_no: ticketNo,
        patient_name: patient.name,
        phone: patient.phone,
        insurance: patient.insurance || "Umum / Bayar Sendiri",
        poli,
        status: "menunggu",
        wait_time: "5-10 menit"
      }]);
    } catch (e) {}

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
  localStorage.removeItem("clinic_inventory_v1");
  localStorage.removeItem("clinic_billing_v1");
  localStorage.removeItem("clinic_lab_v1");
  localStorage.removeItem("clinic_audit_logs_v1");
  localStorage.removeItem("clinic_documents_v1");
  localStorage.removeItem("clinic_doctors_v1");
  logAuditEvent("Reset System Data", "System", "Seluruh data sampel berhasil dibersihkan");
};
