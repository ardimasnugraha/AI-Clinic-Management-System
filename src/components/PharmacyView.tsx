"use client";

import React, { useState, useEffect } from "react";
import { Pill, Plus, Search, Package, AlertTriangle, CheckCircle2, Clock, TrendingDown, Check, Trash2 } from "lucide-react";
import { logAuditEvent } from "@/lib/store";

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

const DEFAULT_INVENTORY: InventoryItem[] = [
  { id: "MED001", name: "Amoksisilin 500mg", stock: 245, min: 50, unit: "kapsul", price: 1500, color: "#0d9488" },
  { id: "MED002", name: "Paracetamol 500mg", stock: 32, min: 50, unit: "tablet", price: 1000, color: "#ef4444" },
  { id: "MED003", name: "Metformin 500mg", stock: 180, min: 50, unit: "tablet", price: 1200, color: "#22c55e" },
  { id: "MED004", name: "Amlodipine 5mg / 10mg", stock: 67, min: 50, unit: "tablet", price: 1500, color: "#f97316" },
  { id: "MED005", name: "OBH Combi Batuk", stock: 15, min: 30, unit: "botol", price: 18000, color: "#ef4444" },
  { id: "MED006", name: "Betahistine Mesylate 6mg", stock: 120, min: 40, unit: "tablet", price: 1600, color: "#8b5cf6" },
];

const DEFAULT_ORDERS: PharmacyOrder[] = [];

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

  useEffect(() => {
    // Load Orders
    try {
      const cachedRx = localStorage.getItem("clinic_pharmacy_v1");
      if (cachedRx) {
        setOrders(JSON.parse(cachedRx));
      } else {
        setOrders([]);
      }
    } catch (e) {}

    // Load Inventory
    try {
      const cachedInv = localStorage.getItem("clinic_inventory_v1");
      if (cachedInv) {
        setInventory(JSON.parse(cachedInv));
      } else {
        setInventory(DEFAULT_INVENTORY);
        localStorage.setItem("clinic_inventory_v1", JSON.stringify(DEFAULT_INVENTORY));
      }
    } catch (e) {}
  }, []);

  const saveOrders = (updated: PharmacyOrder[]) => {
    setOrders(updated);
    try { localStorage.setItem("clinic_pharmacy_v1", JSON.stringify(updated)); } catch (e) {}
  };

  const saveInventory = (updated: InventoryItem[]) => {
    setInventory(updated);
    try { localStorage.setItem("clinic_inventory_v1", JSON.stringify(updated)); } catch (e) {}
  };

  const handleUpdateStatus = (id: string, newStatus: PharmacyOrder["status"]) => {
    const updated = orders.map(o => o.id === id ? { ...o, status: newStatus } : o);
    saveOrders(updated);
    showToast(`Status Resep ${id} diubah menjadi ${newStatus}`);
    logAuditEvent("Update Status Resep Obat", "Farmasi", `Resep ${id} diubah ke ${newStatus}`);
  };

  const handleAddStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockForm.name.trim()) return;

    const newItem: InventoryItem = {
      id: `MED${String(inventory.length + 1).padStart(3, '0')}`,
      name: stockForm.name,
      stock: Number(stockForm.stock),
      min: Number(stockForm.min),
      unit: stockForm.unit,
      price: Number(stockForm.price),
      color: "#0d9488"
    };

    saveInventory([newItem, ...inventory]);
    setShowAddStockModal(false);
    showToast(`Obat Baru ${stockForm.name} berhasil ditambahkan ke inventaris!`);
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
                      Belum ada resep obat masuk.
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
        /* Inventory Table */
        <Container style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Nama Obat", "Stok Saat Ini", "Stok Minimum", "Harga Satuan", "Status Stok", "Aksi"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#64748b", borderBottom: "1px solid #e8f0fe" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inventory.map((inv) => {
                  const isLow = inv.stock < inv.min;
                  return (
                    <tr key={inv.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 10, background: `${inv.color}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Pill style={{ width: 16, height: 16, color: inv.color }} />
                          </div>
                          <span style={{ fontWeight: 800, color: "#0f172a" }}>{inv.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 15, fontWeight: 900, color: isLow ? "#ef4444" : "#0f172a" }}>
                        {inv.stock} {inv.unit}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#64748b" }}>{inv.min} {inv.unit}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0d9488" }}>Rp {inv.price.toLocaleString("id-ID")}</td>
                      <td style={{ padding: "12px 16px" }}>
                        {isLow ? (
                          <span style={{ background: "#fef2f2", color: "#dc2626", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <TrendingDown style={{ width: 12, height: 12 }} /> Stok Menipis
                          </span>
                        ) : (
                          <span style={{ background: "#dcfce7", color: "#15803d", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 800 }}>Aman</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <button 
                          onClick={() => {
                            const addAmount = prompt(`Tambah jumlah stok untuk ${inv.name}:`, "50");
                            if (addAmount && !isNaN(Number(addAmount))) {
                              const updated = inventory.map(item => item.id === inv.id ? { ...item, stock: item.stock + Number(addAmount) } : item);
                              saveInventory(updated);
                              showToast(`Stok ${inv.name} bertambah ${addAmount} ${inv.unit}`);
                            }
                          }}
                          style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", fontSize: 11.5, fontWeight: 700, color: "#334155", cursor: "pointer" }}>
                          + Restock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Container>
      )}

      {/* ADD STOCK MODAL */}
      {showAddStockModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <Container style={{ width: 440, padding: 26 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>Tambah Inventaris Obat</h2>
              <button onClick={() => setShowAddStockModal(false)} style={{ border: "none", background: "#f1f5f9", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13, color: "#64748b", fontWeight: 700 }}>✕</button>
            </div>

            <form onSubmit={handleAddStockSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Nama Obat & Dosis *</label>
                <input 
                  type="text" required value={stockForm.name} 
                  onChange={e => setStockForm({ ...stockForm, name: e.target.value })} 
                  placeholder="Contoh: Ibuprofen 400mg"
                  style={{ width: "100%", padding: "9.5px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none" }} 
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Jumlah Stok Initial</label>
                  <input 
                    type="number" required value={stockForm.stock} 
                    onChange={e => setStockForm({ ...stockForm, stock: Number(e.target.value) })} 
                    style={{ width: "100%", padding: "9.5px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none" }} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Satuan</label>
                  <input 
                    type="text" value={stockForm.unit} 
                    onChange={e => setStockForm({ ...stockForm, unit: e.target.value })} 
                    placeholder="tablet/kapsul/botol"
                    style={{ width: "100%", padding: "9.5px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none" }} 
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Harga Satuan (Rp)</label>
                <input 
                  type="number" value={stockForm.price} 
                  onChange={e => setStockForm({ ...stockForm, price: Number(e.target.value) })} 
                  style={{ width: "100%", padding: "9.5px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none" }} 
                />
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowAddStockModal(false)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 700, color: "#64748b" }}>Batal</button>
                <button type="submit" style={{ flex: 2, padding: "10px 0", borderRadius: 10, border: "none", background: "#0d9488", color: "#fff", fontSize: 13, fontWeight: 800 }}>Simpan Obat Baru</button>
              </div>
            </form>
          </Container>
        </div>
      )}
    </div>
  );
}
