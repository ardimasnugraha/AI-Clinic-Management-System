"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Brain, Bot, User, Activity, AlertCircle, Calendar, Plus, MessageSquare } from "lucide-react";

interface Message {
  sender: "user" | "ai";
  text: string;
  time: string;
}

const PRESET_PROMPTS = [
  { text: "Gejala awal Tuberkulosis (TBC)", label: "Gejala TBC" },
  { text: "Aturan minum obat Amoxicillin", label: "Minum Amoxicillin" },
  { text: "Cara atasi lonjakan antrean Poli Umum", label: "Atasi Antrean Poli" },
  { text: "Rekomendasi penanganan diabetes melitus", label: "Penanganan Diabetes" },
  { text: "Buat draf pesan WhatsApp pengingat imunisasi anak", label: "Draf WA Imunisasi" }
];

const CLINICAL_RECOMMENDATIONS = [
  {
    id: 1,
    title: "Optimasi Alokasi Dokter Poli Umum",
    category: "Operasional",
    desc: "AI memproyeksikan lonjakan pasien di Poli Umum pada jam 10:00 - 12:00 berdasarkan riwayat kunjungan hari Kamis. Disarankan dr. Maya Lestari dialokasikan standby membantu pelayanan.",
    icon: Activity,
    color: "#8b5cf6",
    bg: "#f3e8ff"
  },
  {
    id: 2,
    title: "Pencegahan Efek Samping & Interaksi Obat",
    category: "Keselamatan",
    desc: "AI mendeteksi potensi efek samping jika meresepkan Ciprofloxacin bersamaan dengan Antasida. Disarankan untuk menjeda konsumsi obat minimal 2 jam untuk efektivitas maksimal.",
    icon: AlertCircle,
    color: "#ef4444",
    bg: "#fef2f2"
  },
  {
    id: 3,
    title: "Imunisasi Booster Anak Terlambat",
    category: "Layanan Pasien",
    desc: "AI mengidentifikasi terdapat 12 pasien anak yang terlewat jadwal imunisasi booster DPT. Direkomendasikan untuk mengirimkan draf pesan WhatsApp pengingat ke orang tua pasien.",
    icon: Calendar,
    color: "#0d9488",
    bg: "#ecfdf5"
  },
  {
    id: 4,
    title: "Stok Kritis Paracetamol & Amoxicillin",
    category: "Inventaris",
    desc: "Berdasarkan tren peresepan 7 hari terakhir, stok Paracetamol 500mg dan Amoxicillin kering diproyeksikan habis dalam 4 hari ke depan. Disarankan segera ajukan pengadaan baru.",
    icon: Brain,
    color: "#f97316",
    bg: "#fff7ed"
  }
];

export default function AiAssistantView() {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: "Halo! Saya Asisten AI Klinis Klinik Sehat Sentosa. Saya siap membantu Anda memberikan rekomendasi kesehatan, menganalisis gejala, menjelaskan aturan pakai obat, atau membantu mengoptimalkan alur operasional klinik Anda. Silakan ketik pertanyaan Anda atau pilih tombol cepat di bawah ini!",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const getAiResponse = (input: string): string => {
    const text = input.toLowerCase();
    
    if (text.includes("amoxicillin") || text.includes("amoksisilin") || text.includes("antibiotik")) {
      return "Amoxicillin adalah antibiotik golongan penisilin untuk mengobati infeksi bakteri. Beberapa hal penting:\n\n1. *Harus Dihabiskan*: Wajib dikonsumsi sampai habis meskipun gejala sudah membaik untuk mencegah resistensi bakteri.\n2. *Dosis Umum*: Biasanya diminum tiap 8 jam (3 kali sehari) setelah makan.\n3. *Efek Samping*: Efek samping umum meliputi diare ringan, mual, atau ruam kulit. Jika terjadi reaksi alergi parah (sesak napas, bengkak wajah), segera hubungi dokter.";
    }
    
    if (text.includes("tbc") || text.includes("tuberkulosis") || text.includes("paru")) {
      return "Gejala awal penyakit Tuberkulosis (TBC) paru meliputi:\n\n1. *Batuk Kronis*: Batuk berdahak selama 2 minggu atau lebih (terkadang disertai bercak darah).\n2. *Demam Ringan*: Demam sub-febris berulang terutama di malam hari.\n3. *Keringat Malam*: Berkeringat dingin di malam hari tanpa aktivitas fisik.\n4. *Penurunan Berat Badan*: Disertai penurunan nafsu makan yang drastis.\n5. *Nyeri Dada*: Terutama saat menarik napas dalam atau batuk.\n\n*Rekomendasi Tindakan*: Lakukan Tes Dahak TCM (Tes Cepat Molekuler) di Puskesmas/Klinik terdekat.";
    }

    if (text.includes("antrean") || text.includes("antri") || text.includes("poli umum") || text.includes("lonjakan")) {
      return "Rekomendasi AI untuk mengelola lonjakan antrean di Poli Umum:\n\n1. *Manajemen Staf*: Alokasikan dokter umum cadangan (seperti dr. Maya Lestari) pada jam sibuk (10:00 - 12:00).\n2. *Sistem Triase*: Terapkan pemilahan pasien berdasarkan urgensi keparahan medis sebelum masuk antrean utama.\n3. *Notifikasi WA*: Kirimkan pengingat estimasi waktu tunggu ke nomor WhatsApp pasien untuk menghindari kerumunan di ruang tunggu klinik.";
    }

    if (text.includes("diabetes") || text.includes("gula darah") || text.includes("dm")) {
      return "Rekomendasi penanganan komprehensif untuk Diabetes Melitus (DM) Tipe 2:\n\n1. *Diet Sehat*: Kurangi asupan gula sederhana dan karbohidrat olahan. Perbanyak konsumsi serat (sayur dan biji-bijian).\n2. *Aktivitas Fisik*: Olahraga intensitas sedang (seperti jalan cepat) selama 30 menit sehari, minimal 5 hari seminggu.\n3. *Patuh Obat*: Konsumsi obat anti-diabetik oral (misal Metformin) atau insulin sesuai dosis dan waktu yang ditetapkan dokter.\n4. *Pemantauan Rutin*: Periksa kadar gula darah secara berkala dan periksakan nilai HbA1c setiap 3 bulan.";
    }

    if (text.includes("imunisasi") || text.includes("draf") || text.includes("pesan") || text.includes("wa")) {
      return "Berikut draf pesan WhatsApp pengingat otomatis untuk Imunisasi Anak:\n\n*PENGINGAT IMUNISASI KLINIK SEHAT SENTOSA*\n\nYth. Orang Tua dari Dek [Nama Anak],\n\nKami ingin mengingatkan bahwa jadwal imunisasi booster DPT si kecil sudah dekat demi menjaga kekebalan tubuhnya dari bahaya penyakit Difteri, Pertusis, dan Tetanus.\n\nJadwal Imunisasi:\n📅 Hari: Senin s/d Jumat\n🕒 Jam: 08:00 - 16:00\n🩺 Dokter Spesialis Anak: dr. Rudi Setiawan\n\nSilakan konfirmasi jadwal kehadiran Anda dengan membalas pesan ini.\n\nSalam Hangat,\n*Klinik Sehat Sentosa*";
    }

    if (text.includes("hipertensi") || text.includes("darah tinggi")) {
      return "Hipertensi (tekanan darah ≥ 140/90 mmHg) memerlukan kontrol rutin. Langkah penanganan:\n\n1. *Diet DASH*: Batasi garam dapur maksimal 1 sendok teh per hari. Hindari makanan kaleng, asin, dan cepat saji.\n2. *Kelola Stres*: Lakukan meditasi, tidur cukup (7-8 jam), dan hindari merokok serta kafein berlebih.\n3. *Terapi Obat*: Konsumsi obat antihipertensi (seperti Amlodipine atau Captopril) secara rutin pada waktu yang sama setiap hari.";
    }

    return "Terima kasih atas pertanyaannya. Sebagai Asisten AI Kesehatan, saya sarankan untuk selalu berkonsultasi langsung dengan dokter spesialis di Klinik Sehat Sentosa untuk diagnosis klinis yang akurat dan peresepan obat secara tepat sesuai kondisi medis pasien.";
  };

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      sender: "user",
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    setTimeout(() => {
      const responseText = getAiResponse(text);
      const aiMsg: Message = {
        sender: "ai",
        text: responseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header Banner */}
      <div style={{
        background: "linear-gradient(135deg, #a855f7, #6366f1)",
        borderRadius: 20,
        padding: "24px 32px",
        color: "#fff",
        boxShadow: "0 10px 30px rgba(168, 85, 247, 0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(255, 255, 255, 0.2)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles style={{ width: 28, height: 28, color: "#fff" }} />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>AI Clinical Assistant</h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", margin: "4px 0 0" }}>
              Analisis data klinis instan, rekomendasi preventif, dan asisten konsultasi cerdas.
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.15)", padding: "8px 16px", borderRadius: 30, fontSize: 12, fontWeight: 800 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 10px #22c55e" }} />
          AI Engine Active
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 24, alignItems: "start" }}>
        
        {/* Chatbot Column (Left) */}
        <div style={{
          background: "#fff",
          borderRadius: 20,
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
          height: 600,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}>
          {/* Chat Header */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#f3e8ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#a855f7" }}>
              <Bot style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Asisten Kesehatan AI</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Konsultasi Medis & Operasional Klinik</div>
            </div>
          </div>

          {/* Chat Message History */}
          <div style={{ flex: 1, padding: 20, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16, background: "#f8fafc" }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.sender === "user" ? "flex-end" : "flex-start", gap: 10 }}>
                {msg.sender === "ai" && (
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#e9d5ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#9333ea", flexShrink: 0, fontSize: 11 }}>
                    🤖
                  </div>
                )}
                <div style={{
                  maxWidth: "75%",
                  padding: "12px 16px",
                  borderRadius: msg.sender === "user" ? "18px 18px 2px 18px" : "18px 18px 18px 2px",
                  background: msg.sender === "user" ? "#0d9488" : "#fff",
                  color: msg.sender === "user" ? "#fff" : "#1e293b",
                  border: msg.sender === "user" ? "none" : "1px solid #e2e8f0",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                  fontSize: 12.5,
                  lineHeight: 1.5,
                  whiteSpace: "pre-line"
                }}>
                  {msg.text}
                  <div style={{ textAlign: "right", fontSize: 9, color: msg.sender === "user" ? "rgba(255,255,255,0.7)" : "#94a3b8", marginTop: 6 }}>
                    {msg.time}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#e9d5ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#9333ea", fontSize: 11 }}>
                  🤖
                </div>
                <div style={{ padding: "12px 18px", borderRadius: "18px 18px 18px 2px", background: "#fff", border: "1px solid #e2e8f0", color: "#64748b", fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11 }}>AI sedang menganalisis</span>
                  <span style={{ display: "inline-flex", gap: 2 }}>
                    <span className="dot" style={{ width: 4, height: 4, borderRadius: "50%", background: "#a855f7", animation: "pulse 1s infinite alternate" }} />
                    <span className="dot" style={{ width: 4, height: 4, borderRadius: "50%", background: "#a855f7", animation: "pulse 1s infinite alternate 0.2s" }} />
                    <span className="dot" style={{ width: 4, height: 4, borderRadius: "50%", background: "#a855f7", animation: "pulse 1s infinite alternate 0.4s" }} />
                  </span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick-Prompt Suggestions */}
          <div style={{ padding: "12px 20px", borderTop: "1px solid #f1f5f9", background: "#fff" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>Pencet langsung untuk bertanya cepat:</div>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, whiteSpace: "nowrap" }}>
              {PRESET_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendMessage(prompt.text)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 20,
                    border: "1.5px solid #e2e8f0",
                    background: "#fff",
                    color: "#475569",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#a855f7";
                    e.currentTarget.style.color = "#a855f7";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.color = "#475569";
                  }}
                >
                  <MessageSquare style={{ width: 12, height: 12, color: "#a855f7" }} />
                  {prompt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Message Box */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputText); }}
            style={{ padding: "16px 20px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 10, background: "#fff" }}
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Tanyakan gejala medis, aturan obat, atau solusi antrean..."
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: 12,
                border: "1.5px solid #cbd5e1",
                fontSize: 12.5,
                outline: "none",
                transition: "all 0.2s"
              }}
            />
            <button
              type="submit"
              style={{
                width: 46,
                height: 46,
                borderRadius: 12,
                border: "none",
                background: "#0d9488",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 4px 10px rgba(13,148,136,0.2)"
              }}
            >
              <Send style={{ width: 18, height: 18 }} />
            </button>
          </form>
        </div>

        {/* AI Recommendations Column (Right) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{
            background: "#fff",
            borderRadius: 20,
            border: "1px solid #e2e8f0",
            padding: 20,
            boxShadow: "0 4px 20px rgba(0,0,0,0.03)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: "#faf5ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#a855f7" }}>
                <Brain style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>Rekomendasi Cerdas AI</h3>
                <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>Rekomendasi pencegahan & operasional otomatis</p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {CLINICAL_RECOMMENDATIONS.map((rec) => {
                const Icon = rec.icon;
                return (
                  <div key={rec.id} style={{
                    padding: 14,
                    borderRadius: 14,
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    transition: "transform 0.2s",
                    cursor: "pointer"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 26, height: 26, borderRadius: 6, background: rec.bg, display: "flex", alignItems: "center", justifyContent: "center", color: rec.color }}>
                          <Icon style={{ width: 14, height: 14 }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 800, color: "#0f172a" }}>{rec.title}</span>
                      </div>
                      <span style={{ marginLeft: "auto", fontSize: 9.5, fontWeight: 800, color: rec.color, background: rec.bg, padding: "2px 8px", borderRadius: 10 }}>
                        {rec.category}
                      </span>
                    </div>
                    <p style={{ fontSize: 11.5, color: "#475569", margin: 0, lineHeight: 1.5 }}>{rec.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
