"use client";

import React, { useState, useEffect } from "react";
import { Pill, Plus, Search, Package, AlertTriangle, CheckCircle2, Clock, Filter, Trash2 } from "lucide-react";
import { logAuditEvent } from "@/lib/store";
import { supabase } from "@/lib/supabase/client";

const Container = ({ style, ...p }: any) => (
  <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e8f0fe", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", ...style }} {...p} />
);

export interface PharmacyOrder {
  id: string;
  patientRm: string;
  patientName: string;
  doctorName: string;
  date: string;
  medicines: Array<{ nama: string; dosis: string; jumlah: string | number; harga?: number }>;
  status: "Menunggu Penyiapan" | "Racikan Berjalan" | "Siap Diambil" | "Diserahkan";
}

export interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  min: number;
  unit: string;
  price: number;
  color: string;
  category?: string;
}

export const DEFAULT_INVENTORY: InventoryItem[] = [
  // 1. POLI MATA (dr. Hendra Kusuma)
  { id: "MED-MTA-001", name: "Cendo Xitrol Tetes Mata Steril (5ml)", stock: 70, min: 15, unit: "botol", price: 38000, color: "#3b82f6", category: "Poli Mata" },
  { id: "MED-MTA-002", name: "Cendo Eyefresh / Insto Tetes Mata (15ml)", stock: 90, min: 20, unit: "botol", price: 18000, color: "#3b82f6", category: "Poli Mata" },
  { id: "MED-MTA-003", name: "Cendo Tobroson Tetes Mata (5ml)", stock: 45, min: 10, unit: "botol", price: 52000, color: "#3b82f6", category: "Poli Mata" },
  { id: "MED-MTA-004", name: "Cendo Lyteers Tetes Mata Kering (15ml)", stock: 60, min: 15, unit: "botol", price: 32000, color: "#3b82f6", category: "Poli Mata" },
  { id: "MED-MTA-005", name: "Chloramphenicol Salep Mata Steril 3.5g", stock: 50, min: 12, unit: "tube", price: 15000, color: "#3b82f6", category: "Poli Mata" },
  { id: "MED-MTA-006", name: "Cendo Statrol Tetes Mata Steril (5ml)", stock: 40, min: 10, unit: "botol", price: 42000, color: "#3b82f6", category: "Poli Mata" },

  // 2. POLI PENYAKIT DALAM (dr. Bagus W.)
  { id: "MED-PDL-001", name: "Metformin 500mg", stock: 240, min: 50, unit: "tablet", price: 1800, color: "#0284c7", category: "Poli Penyakit Dalam" },
  { id: "MED-PDL-002", name: "Glimepiride 2mg", stock: 130, min: 30, unit: "tablet", price: 3200, color: "#0284c7", category: "Poli Penyakit Dalam" },
  { id: "MED-PDL-003", name: "Lansoprazole 30mg", stock: 110, min: 25, unit: "kapsul", price: 4500, color: "#0284c7", category: "Poli Penyakit Dalam" },
  { id: "MED-PDL-004", name: "Sukralfat Sirup Maag 500mg/5ml (100ml)", stock: 50, min: 15, unit: "botol", price: 38000, color: "#0284c7", category: "Poli Penyakit Dalam" },
  { id: "MED-PDL-005", name: "Allopurinol 100mg (Asam Urat)", stock: 170, min: 35, unit: "tablet", price: 2000, color: "#0284c7", category: "Poli Penyakit Dalam" },
  { id: "MED-PDL-006", name: "Domperidone 10mg (Anti Mual)", stock: 160, min: 30, unit: "tablet", price: 2200, color: "#0284c7", category: "Poli Penyakit Dalam" },

  // 3. POLI UMUM (dr. Maya Lestari)
  { id: "MED-UMM-001", name: "Paracetamol 500mg", stock: 250, min: 50, unit: "tablet", price: 1500, color: "#0d9488", category: "Poli Umum" },
  { id: "MED-UMM-002", name: "Amoxicillin 500mg", stock: 180, min: 40, unit: "kaplet", price: 2500, color: "#0d9488", category: "Poli Umum" },
  { id: "MED-UMM-003", name: "Ibuprofen 400mg", stock: 150, min: 30, unit: "tablet", price: 2000, color: "#0d9488", category: "Poli Umum" },
  { id: "MED-UMM-004", name: "Cetirizine 10mg", stock: 200, min: 30, unit: "tablet", price: 1800, color: "#0d9488", category: "Poli Umum" },
  { id: "MED-UMM-005", name: "Omeprazole 20mg", stock: 120, min: 25, unit: "kapsul", price: 3500, color: "#0d9488", category: "Poli Umum" },
  { id: "MED-UMM-006", name: "Vitamin C 500mg", stock: 300, min: 50, unit: "tablet", price: 1000, color: "#0d9488", category: "Poli Umum" },

  // 4. POLI GIGI (drg. Sari Dewi)
  { id: "MED-GGI-001", name: "Cataflam 50mg (Potassium Diclofenac)", stock: 100, min: 20, unit: "tablet", price: 7500, color: "#8b5cf6", category: "Poli Gigi" },
  { id: "MED-GGI-002", name: "Asam Mafenamat 500mg", stock: 160, min: 30, unit: "kaplet", price: 2000, color: "#8b5cf6", category: "Poli Gigi" },
  { id: "MED-GGI-003", name: "Ciprofloxacin 500mg", stock: 90, min: 20, unit: "kaplet", price: 4000, color: "#8b5cf6", category: "Poli Gigi" },
  { id: "MED-GGI-004", name: "Minosep Antiseptic Mouthwash 150ml", stock: 45, min: 10, unit: "botol", price: 35000, color: "#8b5cf6", category: "Poli Gigi" },
  { id: "MED-GGI-005", name: "Aloclair Plus Gel Sariawan 8ml", stock: 30, min: 8, unit: "tube", price: 85000, color: "#8b5cf6", category: "Poli Gigi" },
  { id: "MED-GGI-006", name: "Clindamycin 300mg", stock: 80, min: 15, unit: "kapsul", price: 5000, color: "#8b5cf6", category: "Poli Gigi" },

  // 5. POLI JANTUNG (dr. Ahmad Rizki)
  { id: "MED-JTG-001", name: "Amlodipine 10mg", stock: 220, min: 40, unit: "tablet", price: 3000, color: "#f97316", category: "Poli Jantung" },
  { id: "MED-JTG-002", name: "Captopril 25mg", stock: 150, min: 30, unit: "tablet", price: 1500, color: "#f97316", category: "Poli Jantung" },
  { id: "MED-JTG-003", name: "Bisoprolol 5mg", stock: 130, min: 25, unit: "tablet", price: 4500, color: "#f97316", category: "Poli Jantung" },
  { id: "MED-JTG-004", name: "Simvastatin 20mg", stock: 140, min: 30, unit: "tablet", price: 3000, color: "#f97316", category: "Poli Jantung" },
  { id: "MED-JTG-005", name: "Clopidogrel 75mg", stock: 85, min: 20, unit: "tablet", price: 12000, color: "#f97316", category: "Poli Jantung" },
  { id: "MED-JTG-006", name: "ISDN (Isosorbide Dinitrate) 5mg", stock: 95, min: 20, unit: "tablet", price: 2000, color: "#f97316", category: "Poli Jantung" },

  // 6. POLI KULIT (dr. Laila Rahmawati)
  { id: "MED-KLT-001", name: "Hydrocortisone Cream 1% (5g)", stock: 60, min: 15, unit: "tube", price: 12000, color: "#ec4899", category: "Poli Kulit" },
  { id: "MED-KLT-002", name: "Ketoconazole 200mg", stock: 110, min: 25, unit: "tablet", price: 3500, color: "#ec4899", category: "Poli Kulit" },
  { id: "MED-KLT-003", name: "Calamine Lotion 100ml", stock: 40, min: 10, unit: "botol", price: 25000, color: "#ec4899", category: "Poli Kulit" },
  { id: "MED-KLT-004", name: "Salep 2-4 Anti Gatal & Jamur", stock: 75, min: 20, unit: "pot", price: 8000, color: "#ec4899", category: "Poli Kulit" },
  { id: "MED-KLT-005", name: "Dexamethasone 0.5mg", stock: 190, min: 40, unit: "tablet", price: 1200, color: "#ec4899", category: "Poli Kulit" },
  { id: "MED-KLT-006", name: "Desolex Cream (Desonide 10g)", stock: 35, min: 10, unit: "tube", price: 45000, color: "#ec4899", category: "Poli Kulit" },

  // 7. POLI ANAK (dr. Rudi Setiawan)
  { id: "MED-ANK-001", name: "Sanmol Sirup Anak 120mg/5ml (60ml)", stock: 80, min: 20, unit: "botol", price: 18000, color: "#22c55e", category: "Poli Anak" },
  { id: "MED-ANK-002", name: "Tempra Drops Paracetamol Bayi (15ml)", stock: 50, min: 12, unit: "botol", price: 48000, color: "#22c55e", category: "Poli Anak" },
  { id: "MED-ANK-003", name: "Zinc Sirup Diare 20mg/5ml (60ml)", stock: 65, min: 15, unit: "botol", price: 22000, color: "#22c55e", category: "Poli Anak" },
  { id: "MED-ANK-004", name: "Oralit Garam Rehidrasi", stock: 300, min: 50, unit: "sachet", price: 1500, color: "#22c55e", category: "Poli Anak" },
  { id: "MED-ANK-005", name: "Rhinos Neo Drops Flu Anak (10ml)", stock: 40, min: 10, unit: "botol", price: 65000, color: "#22c55e", category: "Poli Anak" },
  { id: "MED-ANK-006", name: "Amoxsan Sirup Kering 125mg/5ml", stock: 55, min: 15, unit: "botol", price: 32000, color: "#22c55e", category: "Poli Anak" }
];

export default function PharmacyView() {
  const [tab, setTab] = useState<"resep" | "stok">("resep");
  const [orders, setOrders] = useState<PharmacyOrder[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Filters State for Inventory
  const [filterPoli, setFilterPoli] = useState<string>("Semua Poli");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Add Item Modal
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [stockForm, setStockForm] = useState({ name: "", stock: 100, min: 30, unit: "tablet", price: 1500, category: "Poli Umum" });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Fetch Inventory and Pharmacy Orders from Supabase / Fallback Cache
  const loadPharmacyData = async () => {
    // 1. Fetch Inventory
    try {
      const { data: invData, error: invErr } = await supabase
        .from("pharmacy_inventory")
        .select("*")
        .order("name", { ascending: true });

      if (!invErr && invData && invData.length > 0) {
        const mappedInv: InventoryItem[] = invData.map((item: any) => ({
          id: item.item_code || item.id,
          name: item.name,
          stock: item.stock,
          min: item.min_stock,
          unit: item.unit,
          price: Number(item.price),
          color: item.color || "#0d9488",
          category: item.category || "Poli Umum"
        }));
        setInventory(mappedInv);
        localStorage.setItem("clinic_inventory_v1", JSON.stringify(mappedInv));
      } else {
        const cachedInv = localStorage.getItem("clinic_inventory_v1");
        if (cachedInv) {
          try {
            const parsed = JSON.parse(cachedInv);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setInventory(parsed);
            } else {
              setInventory(DEFAULT_INVENTORY);
              localStorage.setItem("clinic_inventory_v1", JSON.stringify(DEFAULT_INVENTORY));
            }
          } catch (e) {
            setInventory(DEFAULT_INVENTORY);
            localStorage.setItem("clinic_inventory_v1", JSON.stringify(DEFAULT_INVENTORY));
          }
        } else {
          setInventory(DEFAULT_INVENTORY);
          localStorage.setItem("clinic_inventory_v1", JSON.stringify(DEFAULT_INVENTORY));
        }
      }
    } catch (e) {
      console.warn("Error loading pharmacy inventory from Supabase", e);
      setInventory(DEFAULT_INVENTORY);
    }

    // 2. Fetch Orders
    try {
      const { data: orderData, error: orderErr } = await supabase
        .from("pharmacy_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (!orderErr && orderData) {
        const mappedOrders: PharmacyOrder[] = orderData.map((o: any) => ({
          id: o.order_no || o.id,
          patientRm: o.patient_rm,
          patientName: o.patient_name,
          doctorName: o.doctor_name,
          date: o.date,
          medicines: Array.isArray(o.medicines) ? o.medicines : [],
          status: o.status
        }));
        setOrders(mappedOrders);
        localStorage.setItem("clinic_pharmacy_v1", JSON.stringify(mappedOrders));
      } else {
        const cachedRx = localStorage.getItem("clinic_pharmacy_v1");
        if (cachedRx) setOrders(JSON.parse(cachedRx));
      }
    } catch (e) {
      console.warn("Error loading pharmacy orders from Supabase", e);
    }
  };

  useEffect(() => {
    loadPharmacyData();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: PharmacyOrder["status"]) => {
    const updated = orders.map(o => o.id === id ? { ...o, status: newStatus } : o);
    setOrders(updated);
    try {
      localStorage.setItem("clinic_pharmacy_v1", JSON.stringify(updated));
    } catch (e) {}

    try {
      await supabase.from("pharmacy_orders").update({ status: newStatus }).or(`order_no.eq.${id},id.eq.${id}`);
    } catch (e) {}

    showToast(`Status Resep ${id} diubah menjadi ${newStatus}`);
    logAuditEvent("Update Status Resep Obat", "Farmasi", `Resep ${id} diubah ke ${newStatus}`);
  };

  const handleAddStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockForm.name.trim()) return;

    const nextId = `MED${String(inventory.length + 1).padStart(3, '0')}`;
    const newItem: InventoryItem = {
      id: nextId,
      name: stockForm.name,
      stock: Number(stockForm.stock),
      min: Number(stockForm.min),
      unit: stockForm.unit,
      price: Number(stockForm.price),
      color: stockForm.category === "Poli Mata" ? "#3b82f6" : stockForm.category === "Poli Penyakit Dalam" ? "#0284c7" : stockForm.category === "Poli Gigi" ? "#8b5cf6" : stockForm.category === "Poli Jantung" ? "#f97316" : stockForm.category === "Poli Kulit" ? "#ec4899" : stockForm.category === "Poli Anak" ? "#22c55e" : "#0d9488",
      category: stockForm.category
    };

    // Push to Supabase
    try {
      await supabase.from("pharmacy_inventory").insert([{
        clinic_id: "11111111-1111-1111-1111-111111111111",
        item_code: nextId,
        name: stockForm.name,
        stock: Number(stockForm.stock),
        min_stock: Number(stockForm.min),
        unit: stockForm.unit,
        price: Number(stockForm.price),
        color: newItem.color,
        category: stockForm.category
      }]);
    } catch (e) {
      console.warn("Failed saving stock item to Supabase", e);
    }

    const updated = [newItem, ...inventory];
    setInventory(updated);
    try {
      localStorage.setItem("clinic_inventory_v1", JSON.stringify(updated));
    } catch (e) {}

    setShowAddStockModal(false);
    showToast(`Obat Baru ${stockForm.name} (${stockForm.category}) berhasil ditambahkan!`);
    logAuditEvent("Tambah Inventaris Obat", "Farmasi", `Menambahkan obat ${stockForm.name} stok ${stockForm.stock} ${stockForm.unit}`);
  };

  const filteredInventory = inventory.filter(item => {
    const matchCategory = filterPoli === "Semua Poli" || (item.category || "Poli Umum").toLowerCase().includes(filterPoli.toLowerCase().replace("poli ", ""));
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const readyCount = orders.filter(o => o.status === "Siap Diambil").length;
  const pendingCount = orders.filter(o => o.status === "Menunggu Penyiapan" || o.status === "Racikan Berjalan").length;
  const lowStockCount = inventory.filter(i => i.stock < i.min).length;

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

      {/* Header Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0 }}>Farmasi & Apotek Klinik</h2>
          <p style={{ fontSize: 13, color: "#64748b", margin: "2px 0 0" }}>Kelola antrean resep obat pasien dan inventaris obat seluruh poli spesialis</p>
        </div>

        <button 
          onClick={() => setShowAddStockModal(true)} 
          style={{ 
            display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", 
            borderRadius: 12, border: "none", background: "#0d9488", color: "#fff", 
            fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(13,148,136,0.25)" 
          }}>
          <Plus style={{ width: 16, height: 16 }} />
          <span>Tambah Inventaris Obat</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        {[
          { label: "Total Resep Masuk", val: orders.length, color: "#0d9488", bg: "#e0f2fe", icon: Pill },
          { label: "Siap Diambil", val: readyCount, color: "#22c55e", bg: "#f0fdf4", icon: CheckCircle2 },
          { label: "Dalam Penyiapan", val: pendingCount, color: "#f97316", bg: "#fff7ed", icon: Clock },
          { label: "Stok Obat Menipis", val: lowStockCount, color: "#ef4444", bg: "#fef2f2", icon: AlertTriangle },
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

      {/* View Toggle & Filters */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", width: "fit-content" }}>
          {(["resep", "stok"] as const).map(t => (
            <button 
              key={t} 
              onClick={() => setTab(t)} 
              style={{ 
                padding: "9px 24px", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", 
                background: tab === t ? "#0d9488" : "#fff", color: tab === t ? "#fff" : "#64748b" 
              }}>
              {t === "resep" ? "📋 Daftar Resep Masuk" : `📦 Stok & Inventaris Obat (${inventory.length})`}
            </button>
          ))}
        </div>

        {tab === "stok" && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {/* Filter Poli */}
            <select 
              value={filterPoli} 
              onChange={e => setFilterPoli(e.target.value)} 
              style={{ padding: "8px 12px", borderRadius: 10, border: "1.5px solid #cbd5e1", fontSize: 12.5, fontWeight: 700, color: "#0d9488", background: "#fff", cursor: "pointer", outline: "none" }}>
              <option value="Semua Poli">Semua Poli / Spesialis</option>
              <option value="Poli Mata">Poli Mata (dr. Hendra Kusuma)</option>
              <option value="Poli Penyakit Dalam">Poli Penyakit Dalam (dr. Bagus W.)</option>
              <option value="Poli Gigi">Poli Gigi (drg. Sari Dewi)</option>
              <option value="Poli Jantung">Poli Jantung (dr. Ahmad Rizki)</option>
              <option value="Poli Kulit">Poli Kulit (dr. Laila Rahmawati)</option>
              <option value="Poli Anak">Poli Anak (dr. Rudi Setiawan)</option>
              <option value="Poli Umum">Poli Umum (dr. Maya Lestari)</option>
            </select>

            {/* Search Input */}
            <div style={{ position: "relative" }}>
              <Search style={{ width: 14, height: 14, color: "#94a3b8", position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
              <input 
                type="text" 
                placeholder="Cari nama/kode obat..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ padding: "8px 12px 8px 30px", borderRadius: 10, border: "1.5px solid #cbd5e1", fontSize: 12, outline: "none", width: 180 }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {tab === "resep" ? (
        <Container style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["ID Resep", "Pasien & RM", "Rincian Obat", "Dokter Penulis", "Tanggal", "Status", "Aksi"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#64748b", borderBottom: "1px solid #e8f0fe" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: 36, color: "#94a3b8" }}>
                      Belum ada resep obat masuk dari dokter.
                    </td>
                  </tr>
                ) : (
                  orders.map((r) => (
                    <tr key={r.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                      <td style={{ padding: "12px 16px", color: "#0d9488", fontWeight: 800 }}>{r.id}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 800, color: "#0f172a" }}>{r.patientName}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>{r.patientRm}</div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {r.medicines.map((m, idx) => (
                          <div key={idx} style={{ fontSize: 12, color: "#334155" }}>
                            • <strong>{m.nama}</strong> ({m.jumlah} pcs) - {m.dosis}
                          </div>
                        ))}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#475569", fontWeight: 600 }}>{r.doctorName}</td>
                      <td style={{ padding: "12px 16px", color: "#64748b" }}>{r.date}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ 
                          background: r.status === "Diserahkan" ? "#dcfce7" : r.status === "Siap Diambil" ? "#e0f2fe" : "#fff7ed",
                          color: r.status === "Diserahkan" ? "#15803d" : r.status === "Siap Diambil" ? "#0369a1" : "#c2410c",
                          borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 800 
                        }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          {r.status === "Menunggu Penyiapan" && (
                            <button onClick={() => handleUpdateStatus(r.id, "Racikan Berjalan")} style={{ padding: "5px 10px", borderRadius: 8, border: "none", background: "#f97316", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                              Proses Racikan
                            </button>
                          )}
                          {r.status === "Racikan Berjalan" && (
                            <button onClick={() => handleUpdateStatus(r.id, "Siap Diambil")} style={{ padding: "5px 10px", borderRadius: 8, border: "none", background: "#0ea5e9", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                              Tandai Siap
                            </button>
                          )}
                          {r.status === "Siap Diambil" && (
                            <button onClick={() => handleUpdateStatus(r.id, "Diserahkan")} style={{ padding: "5px 10px", borderRadius: 8, border: "none", background: "#16a34a", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                              Serahkan Obat
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
      ) : (
        <Container style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Kode Obat", "Nama Obat", "Spesialis / Poli", "Stok Tersedia", "Stok Minimum", "Satuan", "Harga / Satuan", "Status Stok"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#64748b", borderBottom: "1px solid #e8f0fe" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: 36, color: "#94a3b8" }}>
                      Tidak ditemukan data obat untuk filter ini. Klik tombol "Tambah Inventaris Obat" untuk menambahkan data baru.
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => (
                    <tr key={item.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                      <td style={{ padding: "12px 16px", color: "#0d9488", fontWeight: 800 }}>{item.id}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0f172a" }}>{item.name}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ 
                          background: (item.color || "#0d9488") + "18", 
                          color: item.color || "#0d9488", 
                          border: `1px solid ${(item.color || "#0d9488")}35`, 
                          borderRadius: 8, padding: "3px 8px", fontSize: 11, fontWeight: 800 
                        }}>
                          {item.category || "Poli Umum"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 800, color: item.stock < item.min ? "#ef4444" : "#0f172a" }}>{item.stock}</td>
                      <td style={{ padding: "12px 16px", color: "#64748b" }}>{item.min}</td>
                      <td style={{ padding: "12px 16px", color: "#475569" }}>{item.unit}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0d9488" }}>Rp {item.price.toLocaleString("id-ID")}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ 
                          background: item.stock < item.min ? "#fef2f2" : "#f0fdf4",
                          color: item.stock < item.min ? "#dc2626" : "#166534",
                          borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 800 
                        }}>
                          {item.stock < item.min ? "Menipis" : "Aman"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Container>
      )}

      {/* Modal Tambah Stok Obat */}
      {showAddStockModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 480, padding: 24, boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "0 0 16px" }}>Tambah Inventaris Obat Baru</h3>
            
            <form onSubmit={handleAddStockSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Poli / Spesialis Dokter *</label>
                <select 
                  value={stockForm.category} 
                  onChange={e => setStockForm({ ...stockForm, category: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 13, background: "#fff", fontWeight: 700, color: "#0d9488" }}>
                  <option value="Poli Umum">Poli Umum (dr. Maya Lestari)</option>
                  <option value="Poli Gigi">Poli Gigi (drg. Sari Dewi)</option>
                  <option value="Poli Jantung">Poli Jantung (dr. Ahmad Rizki)</option>
                  <option value="Poli Kulit">Poli Kulit (dr. Laila Rahmawati)</option>
                  <option value="Poli Anak">Poli Anak (dr. Rudi Setiawan)</option>
                  <option value="Poli Mata">Poli Mata (dr. Hendra Kusuma)</option>
                  <option value="Poli Penyakit Dalam">Poli Penyakit Dalam (dr. Bagus W.)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Nama Obat & Dosis *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: Cendo Xitrol Tetes Mata 5ml"
                  value={stockForm.name} 
                  onChange={e => setStockForm({ ...stockForm, name: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 13 }} 
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Jumlah Stok *</label>
                  <input 
                    type="number" 
                    required
                    min={1}
                    value={stockForm.stock} 
                    onChange={e => setStockForm({ ...stockForm, stock: Number(e.target.value) })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 13 }} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Batas Stok Minimum *</label>
                  <input 
                    type="number" 
                    required
                    min={1}
                    value={stockForm.min} 
                    onChange={e => setStockForm({ ...stockForm, min: Number(e.target.value) })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 13 }} 
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Satuan</label>
                  <select 
                    value={stockForm.unit} 
                    onChange={e => setStockForm({ ...stockForm, unit: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 13, background: "#fff" }}>
                    <option value="tablet">tablet</option>
                    <option value="kapsul">kapsul</option>
                    <option value="botol">botol</option>
                    <option value="ampul">ampul</option>
                    <option value="tube">tube</option>
                    <option value="sachet">sachet</option>
                    <option value="kaplet">kaplet</option>
                    <option value="pot">pot</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Harga Satuan (Rp) *</label>
                  <input 
                    type="number" 
                    required
                    min={0}
                    value={stockForm.price} 
                    onChange={e => setStockForm({ ...stockForm, price: Number(e.target.value) })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 13 }} 
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 10 }}>
                <button type="button" onClick={() => setShowAddStockModal(false)} style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontWeight: 700, cursor: "pointer" }}>
                  Batal
                </button>
                <button type="submit" style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "#0d9488", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
                  Simpan Obat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
