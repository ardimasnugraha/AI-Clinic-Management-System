"use client";

import React, { useState, useEffect } from "react";
import { Receipt, Plus, Search, CircleDollarSign, CheckCircle2, Clock, AlertTriangle, Download, CreditCard, Printer, Check, Eye } from "lucide-react";
import { logAuditEvent } from "@/lib/store";

const Container = ({ style, ...p }: any) => (
  <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e8f0fe", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", ...style }} {...p} />
);

export interface Invoice {
  id: string;
  patientRm: string;
  patientName: string;
  doctorName: string;
  date: string;
  items: Array<{ name: string; category: string; amount: number }>;
  subtotal: number;
  tax: number;
  total: number;
  status: "Lunas" | "Belum Bayar" | "Sebagian";
  paymentMethod?: string;
}

const DEFAULT_INVOICES: Invoice[] = [
  {
    id: "INV-2026-001",
    patientRm: "RM0001234",
    patientName: "Andi Pratama",
    doctorName: "dr. Maya Lestari",
    date: new Date().toISOString().split("T")[0],
    items: [
      { name: "Jasa Konsultasi Dokter Umum", category: "Konsultasi", amount: 50000 },
      { name: "Amoksisilin 500mg (15 Kapsul)", category: "Farmasi", amount: 22500 }
    ],
    subtotal: 72500,
    tax: 0,
    total: 72500,
    status: "Lunas",
    paymentMethod: "BPJS Kesehatan"
  },
  {
    id: "INV-2026-002",
    patientRm: "RM0001236",
    patientName: "Budi Santoso",
    doctorName: "dr. Maya Lestari",
    date: new Date().toISOString().split("T")[0],
    items: [
      { name: "Jasa Konsultasi Dokter Spesialis", category: "Konsultasi", amount: 100000 },
      { name: "Amlodipine 5mg (10 Tab)", category: "Farmasi", amount: 15000 },
      { name: "Betahistine 6mg (15 Tab)", category: "Farmasi", amount: 25000 }
    ],
    subtotal: 140000,
    tax: 0,
    total: 140000,
    status: "Belum Bayar",
    paymentMethod: "Tunai"
  }
];

export default function BillingView() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPayModal, setShowPayModal] = useState<Invoice | null>(null);
  const [payMethod, setPayMethod] = useState("Tunai");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    try {
      const cached = localStorage.getItem("clinic_billing_v1");
      if (cached) {
        setInvoices(JSON.parse(cached));
      } else {
        setInvoices(DEFAULT_INVOICES);
        localStorage.setItem("clinic_billing_v1", JSON.stringify(DEFAULT_INVOICES));
      }
    } catch (e) {}
  }, []);

  const saveInvoices = (updated: Invoice[]) => {
    setInvoices(updated);
    try { localStorage.setItem("clinic_billing_v1", JSON.stringify(updated)); } catch (e) {}
  };

  const handleProcessPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPayModal) return;

    const updated = invoices.map(inv => {
      if (inv.id === showPayModal.id) {
        return {
          ...inv,
          status: "Lunas" as const,
          paymentMethod: payMethod
        };
      }
      return inv;
    });

    saveInvoices(updated);
    logAuditEvent("Pembayaran Kuitansi Lunas", "Kasir / Billing", `Invoice ${showPayModal.id} pasien ${showPayModal.patientName} senilai Rp ${showPayModal.total.toLocaleString("id-ID")} dibayar via ${payMethod}`);

    const paidInvoice = { ...showPayModal, status: "Lunas" as const, paymentMethod: payMethod };
    setShowPayModal(null);
    setSelectedInvoice(paidInvoice);
    showToast(`✓ Pembayaran Invoice ${paidInvoice.id} LUNAS via ${payMethod}`);
  };

  const totalRevenueToday = invoices
    .filter(i => i.status === "Lunas")
    .reduce((acc, i) => acc + i.total, 0);

  const lunasCount = invoices.filter(i => i.status === "Lunas").length;
  const pendingCount = invoices.filter(i => i.status === "Belum Bayar").length;

  const filtered = invoices.filter(i => 
    i.patientName.toLowerCase().includes(search.toLowerCase()) ||
    i.id.toLowerCase().includes(search.toLowerCase()) ||
    i.patientRm.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Toast */}
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
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>Kasir & Billing Pembayaran</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "2px 0 0" }}>Manajemen invoice transaksi kuitansi pembayaran dan penerimaan keuangan</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        {[
          { label: "Total Pendapatan Terbayar", val: `Rp ${totalRevenueToday.toLocaleString("id-ID")}`, color: "#0d9488", bg: "#e0f2fe", icon: CircleDollarSign },
          { label: "Invoice Lunas", val: lunasCount, color: "#22c55e", bg: "#f0fdf4", icon: CheckCircle2 },
          { label: "Belum Dibayar", val: pendingCount, color: "#f97316", bg: "#fff7ed", icon: Clock },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <Container key={i} style={{ padding: 18, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon style={{ width: 22, height: 22, color: s.color }} />
              </div>
              <div>
                <p style={{ fontSize: 11.5, color: "#64748b", fontWeight: 600, margin: 0 }}>{s.label}</p>
                <h3 style={{ fontSize: s.label.startsWith("Total") ? 18 : 26, fontWeight: 800, color: s.color, margin: 0 }}>{s.val}</h3>
              </div>
            </Container>
          );
        })}
      </div>

      {/* Filter Toolbar */}
      <Container style={{ padding: 16 }}>
        <div style={{ position: "relative" }}>
          <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#94a3b8" }} />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Cari no. invoice, nama pasien, atau RM..."
            style={{ width: "100%", paddingLeft: 34, paddingRight: 16, paddingTop: 9, paddingBottom: 9, borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8fafc", fontSize: 13, outline: "none" }} 
          />
        </div>
      </Container>

      {/* Invoice Table */}
      <Container style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["No. Invoice", "Pasien", "Dokter", "Tanggal", "Metode", "Total Tagihan", "Status", "Aksi"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#64748b", borderBottom: "1px solid #e8f0fe" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 36, color: "#94a3b8" }}>
                    Tidak ada invoice tagihan.
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => (
                  <tr key={inv.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 800, color: "#0d9488" }}>{inv.id}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 800, color: "#0f172a" }}>{inv.patientName}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{inv.patientRm}</div>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#475569" }}>{inv.doctorName}</td>
                    <td style={{ padding: "12px 16px", color: "#64748b" }}>{inv.date}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
                        {inv.paymentMethod || "Tunai"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 900, color: "#0f172a" }}>
                      Rp {inv.total.toLocaleString("id-ID")}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ 
                        background: inv.status === "Lunas" ? "#dcfce7" : "#fff7ed",
                        color: inv.status === "Lunas" ? "#15803d" : "#c2410c",
                        borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 800 
                      }}>
                        {inv.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button 
                          onClick={() => setSelectedInvoice(inv)}
                          style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", fontSize: 11, fontWeight: 700, color: "#334155", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                          <Eye style={{ width: 12, height: 12 }} /> Detail
                        </button>

                        {inv.status === "Belum Bayar" ? (
                          <button 
                            onClick={() => setShowPayModal(inv)}
                            style={{ padding: "5px 12px", borderRadius: 8, border: "none", background: "#0d9488", color: "#fff", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
                            Bayar
                          </button>
                        ) : (
                          <button 
                            onClick={() => setSelectedInvoice(inv)}
                            style={{ padding: "5px 10px", borderRadius: 8, border: "none", background: "#f0fdf4", color: "#16a34a", fontSize: 11, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                            <Printer style={{ width: 12, height: 12 }} /> Kuitansi
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

      {/* PROCESS PAYMENT MODAL */}
      {showPayModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <Container style={{ width: 440, padding: 26 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>Proses Pembayaran Invoice</h2>
                <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>{showPayModal.id} — {showPayModal.patientName}</p>
              </div>
              <button onClick={() => setShowPayModal(null)} style={{ border: "none", background: "#f1f5f9", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13, color: "#64748b", fontWeight: 700 }}>✕</button>
            </div>

            <form onSubmit={handleProcessPaymentSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>Total Tagihan Harus Dibayar:</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: "#0d9488", marginTop: 2 }}>
                  Rp {showPayModal.total.toLocaleString("id-ID")}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Metode Pembayaran</label>
                <select 
                  value={payMethod}
                  onChange={e => setPayMethod(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #cbd5e1", fontSize: 13, outline: "none", fontWeight: 700 }}>
                  <option value="Tunai">Tunai / Cash</option>
                  <option value="BPJS Kesehatan">BPJS Kesehatan</option>
                  <option value="QRIS / Transfer">QRIS / Transfer Bank</option>
                  <option value="Kartu Debit / Kredit">Kartu Debit / Kredit</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowPayModal(null)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 700, color: "#64748b" }}>Batal</button>
                <button type="submit" style={{ flex: 2, padding: "10px 0", borderRadius: 10, border: "none", background: "#0d9488", color: "#fff", fontSize: 13, fontWeight: 800 }}>Konfirmasi Pelunasan</button>
              </div>
            </form>
          </Container>
        </div>
      )}

      {/* INVOICE / RECEIPT DETAIL MODAL */}
      {selectedInvoice && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <Container style={{ width: 440, padding: 26, background: "#fff" }}>
            <div style={{ borderBottom: "2px stroke #0f172a", paddingBottom: 12, marginBottom: 16, textAlign: "center" }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: "#0f172a", margin: 0 }}>Klinik Sehat Sentosa</h3>
              <p style={{ fontSize: 11, color: "#64748b", margin: "2px 0 0" }}>KUITANSI PEMBAYARAN RESMI</p>
              <p style={{ fontSize: 10, color: "#94a3b8" }}>No: {selectedInvoice.id}</p>
            </div>

            <div style={{ fontSize: 12, marginBottom: 16, display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Nama Pasien:</span>
                <strong>{selectedInvoice.patientName} ({selectedInvoice.patientRm})</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Dokter:</span>
                <span>{selectedInvoice.doctorName}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Tanggal:</span>
                <span>{selectedInvoice.date}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Metode Bayar:</span>
                <strong>{selectedInvoice.paymentMethod || "Tunai"}</strong>
              </div>
            </div>

            {/* Rincian Items */}
            <div style={{ borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0", padding: "10px 0", marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", marginBottom: 6 }}>RINCIAN ITEM TAGIHAN:</div>
              {selectedInvoice.items.map((item, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: "#334155" }}>{item.name}</span>
                  <span style={{ fontWeight: 700 }}>Rp {item.amount.toLocaleString("id-ID")}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 900, color: "#0d9488", marginBottom: 20 }}>
              <span>TOTAL BAYAR:</span>
              <span>Rp {selectedInvoice.total.toLocaleString("id-ID")}</span>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setSelectedInvoice(null)} style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "1px solid #cbd5e1", background: "#fff", fontSize: 12, fontWeight: 700 }}>Tutup</button>
              <button onClick={() => window.print()} style={{ flex: 2, padding: "9px 0", borderRadius: 10, border: "none", background: "#0d9488", color: "#fff", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Printer style={{ width: 14, height: 14 }} /> Cetak Kuitansi
              </button>
            </div>
          </Container>
        </div>
      )}
    </div>
  );
}
