"use client";

import React, { useState, useEffect } from "react";
import { Receipt, Plus, Search, CircleDollarSign, CheckCircle2, Clock, AlertTriangle, Download, CreditCard, Printer, Check, Eye } from "lucide-react";
import { logAuditEvent } from "@/lib/store";
import { supabase } from "@/lib/supabase/client";

const Container = ({ style, ...p }: any) => (
  <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e8f0fe", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", ...style }} {...p} />
);

export interface Invoice {
  id: string;
  patientRm: string;
  patientName: string;
  doctorName: string;
  insurance?: string;
  date: string;
  items: Array<{ name: string; category: string; amount: number }>;
  subtotal: number;
  tax: number;
  total: number;
  status: "Lunas" | "Belum Bayar" | "Sebagian";
  paymentMethod?: string;
}

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

  const loadInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        const mapped: Invoice[] = data.map((inv: any) => ({
          id: inv.invoice_no || inv.id,
          patientRm: inv.patient_rm,
          patientName: inv.patient_name,
          doctorName: inv.doctor_name,
          insurance: inv.insurance,
          date: inv.date,
          items: Array.isArray(inv.items) ? inv.items : [],
          subtotal: Number(inv.subtotal),
          tax: Number(inv.tax),
          total: Number(inv.total),
          status: inv.status,
          paymentMethod: inv.payment_method
        }));
        setInvoices(mapped);
        localStorage.setItem("clinic_billing_v1", JSON.stringify(mapped));
      } else {
        const cached = localStorage.getItem("clinic_billing_v1");
        if (cached) setInvoices(JSON.parse(cached));
      }
    } catch (e) {
      console.warn("Error loading invoices from Supabase", e);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleProcessPaymentSubmit = async (e: React.FormEvent) => {
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

    setInvoices(updated);
    try { localStorage.setItem("clinic_billing_v1", JSON.stringify(updated)); } catch (e) {}

    try {
      await supabase.from("invoices").update({
        status: "Lunas",
        payment_method: payMethod
      }).or(`invoice_no.eq.${showPayModal.id},id.eq.${showPayModal.id}`);
    } catch (e) {}

    showToast(`Pembayaran Tagihan ${showPayModal.id} sebesar Rp ${showPayModal.total.toLocaleString("id-ID")} berhasil (Metode: ${payMethod})`);
    logAuditEvent("Proses Pembayaran Kasir", "Billing", `Pembayaran Lunas INV ${showPayModal.id} pasien ${showPayModal.patientName} via ${payMethod}`);
    setShowPayModal(null);
  };

  const totalIncome = invoices.filter(i => i.status === "Lunas").reduce((acc, curr) => acc + curr.total, 0);
  const pendingAmount = invoices.filter(i => i.status === "Belum Bayar").reduce((acc, curr) => acc + curr.total, 0);
  const paidCount = invoices.filter(i => i.status === "Lunas").length;
  const pendingCount = invoices.filter(i => i.status === "Belum Bayar").length;

  const filtered = invoices.filter(i =>
    !search ||
    i.id.toLowerCase().includes(search.toLowerCase()) ||
    i.patientName.toLowerCase().includes(search.toLowerCase()) ||
    i.patientRm.toLowerCase().includes(search.toLowerCase())
  );

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
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>Modul Kasir & Billing Pembayaran</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "2px 0 0" }}>Kelola invoice tagihan pelayanan, rincian biaya tindakan, & klaim asuransi</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        {[
          { label: "Total Pendapatan Lunas", val: `Rp ${totalIncome.toLocaleString("id-ID")}`, color: "#0d9488", bg: "#e0f2fe", icon: CircleDollarSign },
          { label: "Piutang Belum Bayar", val: `Rp ${pendingAmount.toLocaleString("id-ID")}`, color: "#ef4444", bg: "#fef2f2", icon: AlertTriangle },
          { label: "Transaksi Lunas", val: `${paidCount} Invoice`, color: "#22c55e", bg: "#f0fdf4", icon: CheckCircle2 },
          { label: "Menunggu Pembayaran", val: `${pendingCount} Tagihan`, color: "#f97316", bg: "#fff7ed", icon: Clock },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <Container key={i} style={{ padding: 18, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon style={{ width: 22, height: 22, color: s.color }} />
              </div>
              <div>
                <p style={{ fontSize: 11.5, color: "#64748b", fontWeight: 600, margin: 0 }}>{s.label}</p>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: s.color, margin: 0 }}>{s.val}</h3>
              </div>
            </Container>
          );
        })}
      </div>

      {/* Search Bar */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div style={{ position: "relative", width: 280 }}>
          <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "#94a3b8" }} />
          <input 
            type="text" 
            placeholder="Cari No Invoice, RM, nama pasien..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "9px 14px 9px 36px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: 12.5 }}
          />
        </div>
      </div>

      {/* Table Invoices */}
      <Container style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["No Invoice", "Pasien & RM", "Penjamin / Asuransi", "Dokter", "Tanggal", "Total Biaya", "Status", "Aksi"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#64748b", borderBottom: "1px solid #e8f0fe" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 36, color: "#94a3b8" }}>
                    Belum ada data tagihan/invoice transaksi kasir.
                  </td>
                </tr>
              ) : (
                filtered.map(inv => (
                  <tr key={inv.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <td style={{ padding: "12px 16px", color: "#0d9488", fontWeight: 800 }}>{inv.id}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 800, color: "#0f172a" }}>{inv.patientName}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{inv.patientRm}</div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: "#f1f5f9", color: "#475569", padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                        {inv.insurance || "Umum / Bayar Sendiri"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#475569" }}>{inv.doctorName}</td>
                    <td style={{ padding: "12px 16px", color: "#64748b" }}>{inv.date}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 800, color: "#0f172a" }}>Rp {inv.total.toLocaleString("id-ID")}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ 
                        background: inv.status === "Lunas" ? "#dcfce7" : "#fef2f2",
                        color: inv.status === "Lunas" ? "#15803d" : "#dc2626",
                        borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 800 
                      }}>
                        {inv.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => setSelectedInvoice(inv)} style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                          <Eye style={{ width: 12, height: 12 }} /> Rincian
                        </button>
                        {inv.status === "Belum Bayar" && (
                          <button onClick={() => setShowPayModal(inv)} style={{ padding: "5px 12px", borderRadius: 8, border: "none", background: "#0d9488", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                            Bayar
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

      {/* Modal Rincian Invoice */}
      {selectedInvoice && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 500, padding: 24, boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1px solid #f1f5f9", paddingBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: "#0d9488", fontWeight: 800 }}>RUKUN / KLINIK SEHAT SENTOSA</div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: "#0f172a", margin: 0 }}>Invoice: {selectedInvoice.id}</h3>
              </div>
              <button onClick={() => setSelectedInvoice(null)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 18, color: "#64748b" }}>✕</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12, color: "#334155", marginBottom: 16 }}>
              <div><strong>Pasien:</strong> {selectedInvoice.patientName}</div>
              <div><strong>No. RM:</strong> {selectedInvoice.patientRm}</div>
              <div><strong>Dokter:</strong> {selectedInvoice.doctorName}</div>
              <div><strong>Tanggal:</strong> {selectedInvoice.date}</div>
              <div><strong>Penjamin:</strong> {selectedInvoice.insurance || "Umum"}</div>
              <div><strong>Status:</strong> <span style={{ color: selectedInvoice.status === "Lunas" ? "#166534" : "#dc2626", fontWeight: 800 }}>{selectedInvoice.status}</span></div>
            </div>

            <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={{ padding: "8px 12px", textAlign: "left", color: "#64748b" }}>Item Layanan / Obat</th>
                    <th style={{ padding: "8px 12px", textAlign: "right", color: "#64748b" }}>Biaya</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items.map((item, idx) => (
                    <tr key={idx} style={{ borderTop: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "8px 12px", color: "#0f172a", fontWeight: 600 }}>{item.name}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "#334155" }}>Rp {item.amount.toLocaleString("id-ID")}</td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: "2px solid #e2e8f0", background: "#f8fafc", fontWeight: 800 }}>
                    <td style={{ padding: "10px 12px", color: "#0f172a" }}>Total Pembayaran</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: "#0d9488", fontSize: 14 }}>Rp {selectedInvoice.total.toLocaleString("id-ID")}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setSelectedInvoice(null)} style={{ padding: "9px 18px", borderRadius: 10, border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontWeight: 700, cursor: "pointer" }}>
                Tutup
              </button>
              <button onClick={() => alert("Mencetak Struk Kasir...")} style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: "#0d9488", color: "#fff", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <Printer style={{ width: 14, height: 14 }} /> Cetak Struk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Proses Bayar */}
      {showPayModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 440, padding: 24, boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>Proses Pembayaran Kasir</h3>
            <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 16px" }}>No Invoice: {showPayModal.id} • Pasien: {showPayModal.patientName}</p>

            <form onSubmit={handleProcessPaymentSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: "#f0fdf4", padding: 14, borderRadius: 12, border: "1px solid #bbf7d0", textAlign: "center" }}>
                <div style={{ fontSize: 12, color: "#166534", fontWeight: 600 }}>Total yang harus dibayar:</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#15803d", marginTop: 2 }}>Rp {showPayModal.total.toLocaleString("id-ID")}</div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6 }}>Metode Pembayaran *</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {["Tunai", "QRIS", "Transfer Bank", "Debit / Kredit", "BPJS Kesehatan"].map(m => (
                    <button 
                      key={m}
                      type="button"
                      onClick={() => setPayMethod(m)}
                      style={{ 
                        padding: "10px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer",
                        border: payMethod === m ? "2px solid #0d9488" : "1px solid #cbd5e1",
                        background: payMethod === m ? "#e0f2fe" : "#fff",
                        color: payMethod === m ? "#0369a1" : "#475569"
                      }}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 10 }}>
                <button type="button" onClick={() => setShowPayModal(null)} style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontWeight: 700, cursor: "pointer" }}>
                  Batal
                </button>
                <button type="submit" style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "#0d9488", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
                  Konfirmasi Lunas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
