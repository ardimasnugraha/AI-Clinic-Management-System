"use client";

import React, { useState, useEffect } from "react";
import { Pill, Plus, Search, Package, AlertTriangle, CheckCircle2, Clock, TrendingDown, Check, Trash2 } from "lucide-react";
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
}

export default function PharmacyView() {
  const [tab, setTab] = useState<"resep" | "stok">("resep");
  const [orders, setOrders] = useState<PharmacyOrder[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Add Item Modal
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [stockForm, setStockForm] = useState({ name: "", stock: 100, min: 30, unit: "tablet", price: 1500 });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Fetch Inventory and Pharmacy Orders from Supabase
  const loadPharmacyData = async () => {
    // 1. Fetch Inventory
    try {
      const { data: invData, error: invErr } = await supabase
        .from("pharmacy_inventory")
        .select("*")
        .order("name", { ascending: true });

      if (!invErr && invData) {
        const mappedInv: InventoryItem[] = invData.map((item: any) => ({
          id: item.item_code || item.id,
          name: item.name,
          stock: item.stock,
          min: item.min_stock,
          unit: item.unit,
          price: Number(item.price),
          color: item.color || "#0d9488"
        }));
        setInventory(mappedInv);
        localStorage.setItem("clinic_inventory_v1", JSON.stringify(mappedInv));
      } else {
        const cachedInv = localStorage.getItem("clinic_inventory_v1");
        if (cachedInv) setInventory(JSON.parse(cachedInv));
      }
    } catch (e) {
      console.warn("Error loading pharmacy inventory from Supabase", e);
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
      color: "#0d9488"
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
        color: "#0d9488"
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
    showToast(`Obat Baru ${stockForm.name} berhasil ditambahkan ke inventaris!`);
    logAuditEvent("Tambah Inventaris Obat", "Farmasi", `Menambahkan obat ${stockForm.name} stok ${stockForm.stock} ${stockForm.unit}`);
  };

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

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>Modul Farmasi & Apotek</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "2px 0 0" }}>Kelola pemenuhan resep dokter, inventaris stok obat, dan penyerahan obat</p>
        </div>

        <button 
          onClick={() => setShowAddStockModal(true)}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "#0d9488", color: "#fff", border: "none", borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(13,148,136,0.25)" }}>
          <Plus style={{ width: 16, height: 16 }} /> Tambah Inventaris Obat
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
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

      {/* View Toggle */}
      <div style={{ display: "flex", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", width: "fit-content" }}>
        {(["resep", "stok"] as const).map(t => (
          <button 
            key={t} 
            onClick={() => setTab(t)} 
            style={{ 
              padding: "9px 24px", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", 
              background: tab === t ? "#0d9488" : "#fff", color: tab === t ? "#fff" : "#64748b" 
            }}>
            {t === "resep" ? "📋 Daftar Resep Masuk" : "📦 Stok & Inventaris Obat"}
          </button>
        ))}
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
                  {["Kode Obat", "Nama Obat", "Stok Tersedia", "Stok Minimum", "Satuan", "Harga / Satuan", "Status Stok"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#64748b", borderBottom: "1px solid #e8f0fe" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inventory.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: 36, color: "#94a3b8" }}>
                      Inventaris obat kosong. Klik tombol "Tambah Inventaris Obat" untuk menambahkan data obat baru.
                    </td>
                  </tr>
                ) : (
                  inventory.map((item) => (
                    <tr key={item.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                      <td style={{ padding: "12px 16px", color: "#0d9488", fontWeight: 800 }}>{item.id}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0f172a" }}>{item.name}</td>
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
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Nama Obat & Dosis *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: Paracetamol 500mg"
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
                    <option value="strip">strip</option>
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
