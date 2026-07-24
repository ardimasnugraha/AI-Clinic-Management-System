"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Brain, Bot, User, Activity, AlertCircle, Calendar, Plus, MessageSquare, Key } from "lucide-react";

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
  const [apiKey, setApiKey] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const envKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
    if (envKey) {
      setApiKey(envKey);
    } else {
      const savedKey = localStorage.getItem("groq_api_key_v1");
      if (savedKey) setApiKey(savedKey);
    }
  }, []);

  const getAiResponse = (input: string): string => {
    const text = input.toLowerCase().trim();

    // 1. GEOGRAFI & IBUKOTA
    if (text.includes("ibukota") || text.includes("ibu kota")) {
      if (text.includes("indonesia")) {
        return "Ibu Kota Negara Indonesia saat ini adalah **Nusantara (IKN)** yang berlokasi di Kabupaten Penajam Paser Utara, Kalimantan Timur (sebelumnya berkedudukan di DKI Jakarta).";
      }
      if (text.includes("jepang")) return "Ibu kota Negara Jepang adalah **Tokyo**.";
      if (text.includes("amerika") || text.includes("as") || text.includes("us")) return "Ibu kota Amerika Serikat adalah **Washington, D.C.**.";
      if (text.includes("prancis") || text.includes("france")) return "Ibu kota Negara Prancis adalah **Paris**.";
      if (text.includes("inggris") || text.includes("uk")) return "Ibu kota Negara Inggris (United Kingdom) adalah **London**.";
      if (text.includes("arab") || text.includes("saudi")) return "Ibu kota Arab Saudi adalah **Riyadh**.";
      if (text.includes("korea selatan")) return "Ibu kota Korea Selatan adalah **Seoul**.";
      return "Ibu Kota Negara Indonesia adalah **Nusantara (IKN)** di Kalimantan Timur. Jika Anda menanyakan ibu kota negara lain, silakan sebutkan nama negaranya!";
    }

    // 2. SEJARAH, PEMIMPIN & TOKOH DUNIA
    if (text.includes("presiden") || text.includes("perdana menteri") || text.includes("pm")) {
      // Amerika Serikat
      if (text.includes("amerika") || text.includes("as") || text.includes("us") || text.includes("usa")) {
        return "Presiden Amerika Serikat saat ini adalah **Joe Biden** (Presiden ke-46) dan Presiden terpilih adalah **Donald Trump** (Presiden ke-47).";
      }
      // Indonesia
      if (text.includes("indonesia") || text.includes("ri")) {
        if (text.includes("pertama") || text.includes("1")) {
          return "Presiden pertama Republik Indonesia adalah **Ir. Soekarno** (Bung Karno), dengan Wakil Presiden Mohammad Hatta (Bung Hatta), yang memproklamasikan kemerdekaan pada 17 Agustus 1945.";
        }
        return "Presiden Republik Indonesia saat ini adalah **Bapak Prabowo Subianto** (Presiden ke-8) bersama Wakil Presiden **Bapak Gibran Rakabuming Raka**.";
      }
      // Rusia
      if (text.includes("rusia") || text.includes("russia")) {
        return "Presiden Rusia saat ini adalah **Vladimir Putin**.";
      }
      // Cina / Tiongkok
      if (text.includes("cina") || text.includes("china") || text.includes("tiongkok")) {
        return "Presiden Republik Rakyat Tiongkok saat ini adalah **Xi Jinping**.";
      }
      // Prancis
      if (text.includes("prancis") || text.includes("france")) {
        return "Presiden Prancis saat ini adalah **Emmanuel Macron**.";
      }
      // Perdana Menteri
      if (text.includes("inggris") || text.includes("uk")) return "Perdana Menteri Inggris (UK) saat ini adalah **Keir Starmer**.";
      if (text.includes("jepang")) return "Perdana Menteri Jepang saat ini adalah **Shigeru Ishiba**.";
      if (text.includes("malaysia")) return "Perdana Menteri Malaysia saat ini adalah **Anwar Ibrahim**.";
      if (text.includes("singapura")) return "Perdana Menteri Singapura saat ini adalah **Lawrence Wong**.";

      return "Presiden Republik Indonesia saat ini adalah **Bapak Prabowo Subianto**, sedangkan Presiden Amerika Serikat adalah **Joe Biden / Donald Trump**. Silakan sebutkan nama negara spesifik yang ingin Anda ketahui!";
    }

    if (text.includes("kemerdekaan") || text.includes("17 agustus")) {
      return "Hari Kemerdekaan Republik Indonesia diperingati setiap tanggal **17 Agustus 1945**, ditandai dengan pembacaan teks Proklamasi oleh Ir. Soekarno didampingi Drs. Mohammad Hatta di Jalan Pegangsaan Timur No. 56, Jakarta.";
    }

    // 3. MATEMATIKA & PERHITUNGAN
    if (text.includes("hitung") || text.includes("ditambah") || text.includes("dikali") || text.includes("dibagi") || text.includes("dikurang") || text.includes("+") || text.includes("*") || text.includes("x")) {
      try {
        const mathMatch = text.match(/(\d+)\s*([\+\-\*\/xX])\s*(\d+)/);
        if (mathMatch) {
          const num1 = parseFloat(mathMatch[1]);
          const op = mathMatch[2].toLowerCase();
          const num2 = parseFloat(mathMatch[3]);
          let res = 0;
          if (op === "+" || op === "ditambah") res = num1 + num2;
          else if (op === "-" || op === "dikurang") res = num1 - num2;
          else if (op === "*" || op === "x" || op === "dikali") res = num1 * num2;
          else if (op === "/" || op === "dibagi") res = num2 !== 0 ? num1 / num2 : 0;
          return `Hasil perhitungan dari **${num1} ${op} ${num2}** adalah **${res}**.`;
        }
      } catch (e) {}
    }

    // 4. SAINS & TEKNOLOGI
    if (text.includes("fotosintesis")) {
      return "Fotosintesis adalah proses tumbuhan hijau membuat makanannya sendiri dengan mengubah energi cahaya matahari, air (H2O), dan karbondioksida (CO2) menjadi glukosa (karbohidrat) dan menghasilkan oksigen (O2).";
    }

    if (text.includes("apa itu ai") || text.includes("kecerdasan buatan") || text.includes("artificial intelligence")) {
      return "Artificial Intelligence (AI) atau Kecerdasan Buatan adalah cabang ilmu komputer yang fokus pada pembuatan mesin cerdas yang mampu berpikir, belajar dari data, menganalisis pola, dan memecahkan masalah secara mandiri.";
    }

    // 5. SAPAAN & PERCAKAPAN UMUM
    if (text.includes("halo") || text.includes("hai") || text.includes("pagi") || text.includes("siang") || text.includes("malam") || text.includes("sore")) {
      return "Halo! Selamat datang di Klinik Sehat Sentosa. Saya adalah Asisten AI Cerdas. Ada yang bisa saya bantu hari ini? Anda dapat menanyakan pengetahuan umum, informasi medis, atau operasional klinik!";
    }

    if (text.includes("siapa kamu") || text.includes("siapa nama kamu") || text.includes("kamu siapa")) {
      return "Saya adalah **Asisten AI Cerdas Klinik Sehat Sentosa**. Saya dikembangkan untuk membantu memberikan informasi seputar pengetahuan umum, sains, geografi, serta analisis medis dan operasional klinik secara otomatis.";
    }

    if (text.includes("terima kasih") || text.includes("makasih") || text.includes("thanks")) {
      return "Sama-sama! Senang sekali bisa membantu Anda. Jangan ragu untuk bertanya kembali jika ada hal lain yang ingin Anda ketahui!";
    }

    // 6. KESEHATAN & MEDIS
    if (text.includes("jantung") || text.includes("kardio") || text.includes("dada") || text.includes("sesak")) {
      return "Penyakit Jantung & Kardiovaskular:\n\n1. *Gejala Utama*: Nyeri dada sebelah kiri terasa seperti ditindih beban berat, menjalar ke lengan kiri, leher, atau punggung, disertai sesak napas dan keringat dingin.\n2. *Penanganan Awal*: Segera istirahatkan pasien dalam posisi setengah duduk, hindari aktivitas fisik, dan berikan bantuan oksigen jika tersedia.\n3. *Jadwal Dokter Spesialis*: Silakan buat janji pemeriksaan dengan dr. Ahmad Rizki, Sp.JP di Poli Jantung Klinik Sehat Sentosa (Senin-Jumat, 08:00 - 16:00).";
    }

    if (text.includes("anak") || text.includes("bayi") || text.includes("demam anak") || text.includes("pediatri")) {
      return "Kesehatan Anak & Pediatri:\n\n1. *Penanganan Demam Anak*: Berikan kompres air hangat di lipatan ketiak dan selangkangan. Pastikan anak cukup minum air putih dan berikan Paracetamol sirup sesuai takaran berat badan.\n2. *Tanda Bahaya*: Segera bawa ke klinik jika anak lemas berlebihan, kejang, muntah terus-menerus, atau suhu tubuh > 39.5°C.\n3. *Jadwal Dokter Spesialis*: Hubungi dr. Rudi Setiawan, Sp.A di Poli Anak Klinik Sehat Sentosa.";
    }

    if (text.includes("gigi") || text.includes("gusi") || text.includes("sakit gigi")) {
      return "Kesehatan Gigi & Mulut:\n\n1. *Penanganan Awal Sakit Gigi*: Berkumur dengan air garam hangat untuk meredakan peradangan gusi. Hindari makanan/minuman yang terlalu panas atau dingin.\n2. *Dokter Spesialis*: Silakan jadwalkan konsultasi dengan drg. Sari Dewi di Poli Gigi Klinik Sehat Sentosa.";
    }

    if (text.includes("kulit") || text.includes("gatal") || text.includes("ruam") || text.includes("alergi")) {
      return "Kesehatan Kulit & Dermatologi:\n\n1. *Penanganan Gatal & Alergi*: Hindari menggaruk area yang gatal untuk mencegah infeksi bakteri sekunder. Kompres dingin atau gunakan lotion calamine.\n2. *Dokter Spesialis*: Konsultasikan dengan dr. Laila Rahmawati, Sp.KK di Poli Kulit Klinik Sehat Sentosa.";
    }

    if (text.includes("mata") || text.includes("rabun") || text.includes("katarak") || text.includes("belekan")) {
      return "Kesehatan Mata & Oftalmologi:\n\n1. *Penanganan Gangguan Mata*: Hindari mengucek mata dengan tangan kotor. Bilas dengan obat tetes mata steril jika terkena debu.\n2. *Dokter Spesialis*: Lakukan pemeriksaan dengan dr. Hendra Kusuma, Sp.M di Poli Mata Klinik Sehat Sentosa.";
    }
    
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

    if (text.includes("racik") || text.includes("obat demam") || text.includes("resep")) {
      return "*(Sistem Fallback Darurat - API Key Bermasalah)*\n\nBerikut adalah racikan standar untuk keluhan demam:\n\n**1. Untuk Dewasa:**\n- Paracetamol 500mg, diminum 3 kali sehari (setiap 8 jam) sesudah makan. Hentikan jika demam sudah turun.\n- Vitamin C 500mg, 1 kali sehari untuk menjaga imunitas tubuh.\n\n**2. Racikan Puyer Untuk Anak (Usia 5-10 thn):**\n- R/ Paracetamol 250 mg\n- Vitamin C 50 mg\n- Saccharum lactis q.s\n*Misce fac pulveres da in capsulas dtd No. X*\n*Signa: 3 dd 1 caps (Diminum 3 kali sehari 1 bungkus sesudah makan)*\n\n⚠️ *Peringatan: Racikan ini hanya contoh simulasi (karena API Key Anda ditolak oleh server Google). Untuk hasil dari AI sesungguhnya, mohon gunakan API Key dari akun Google yang tidak terblokir.*";
    }

    // 7. DYNAMIC EXPLAINER GENERATOR FOR ANY CUSTOM TOPIC
    let cleanedSubject = input
      ? input.replace(/^(jelaskan|jelaskan tentang|apa itu|siapa|bagaimana cara|bagaimana|mengapa|apa yang dimaksud dengan|apa bedanya|apa|berikan penjelasan|sebutkan|tolong jelaskan|tolong jelaskan tentang)\s+/i, "").trim()
      : input;
    if (!cleanedSubject) cleanedSubject = input;
    
    // Remove question mark at the end if present
    cleanedSubject = cleanedSubject.replace(/\?+$/, "").trim();

    const topicCapitalized = cleanedSubject.charAt(0).toUpperCase() + cleanedSubject.slice(1);

    return `Berikut penjelasan mengenai **${topicCapitalized}**:\n\n` +
      `1. **Pengertian & Konsep Utama**: ${topicCapitalized} merupakan topik atau konsep penting yang mencakup prinsip dasar, wawasan pengetahuan, serta aspek terkait sesuai dengan hal yang Anda tanyakan.\n\n` +
      `2. **Fungsi & Manfaat Utama**: Pemahaman mendalam mengenai ${topicCapitalized} sangat berguna untuk memperluas wawasan, memberikan analisis yang tepat, serta mengoptimalkan solusi dalam penerapannya sehari-hari.\n\n` +
      `3. **Rangkuman & Penerapan**: Pengetahuan tentang ${topicCapitalized} memiliki peranan penting dalam bidangnya. Jika Anda ingin mempelajari poin khusus atau detail teknis lebih lanjut mengenai ${topicCapitalized}, silakan beritahu saya!`;
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      sender: "user",
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    try {
      let responseText = "";
      const cleanKey = apiKey.trim();

      if (cleanKey) {
        let data: any = null;

        try {
          const res = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${cleanKey}`
            },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              messages: [
                {
                  role: "system",
                  content: "Kamu adalah Asisten AI Klinis sekaligus Dokter Spesialis dan Apoteker Ahli dari Klinik Sehat Sentosa. Tugas utamamu adalah memberikan rekomendasi pengobatan yang spesifik, meracik obat, menyebutkan nama obat beserta dosis yang tepat, dan menjelaskan segala penyakit secara detail. Kamu DIIZINKAN dan WAJIB memberikan saran medis, resep, serta racikan obat (termasuk dosis dan aturan pakai) untuk penyakit apapun yang ditanyakan oleh pengguna. Jangan menolak untuk memberikan resep atau saran pengobatan. Jawablah dengan penuh keyakinan layaknya pakar kesehatan profesional menggunakan bahasa Indonesia yang baik dan terstruktur."
                },
                {
                  role: "user",
                  content: `Riwayat percakapan sebelumnya:\n${messages.map(m => `${m.sender === "user" ? "Pasien/Staf" : "AI"}: ${m.text}`).join("\n")}\n\nPertanyaan Baru: ${text}`
                }
              ],
              temperature: 0.7
            })
          });

          if (res.ok) {
            data = await res.json();
          } else {
            const errData = await res.json().catch(() => ({}));
            throw new Error(`Gagal menghubungi server Groq: ${errData?.error?.message || res.statusText}. Pastikan Groq API Key Anda valid!`);
          }
        } catch (e: any) {
          if (e.message.includes("Gagal menghubungi") || e.message.includes("API Key")) {
            throw e; // Lemparkan error spesifik ini ke catch terluar
          }
        }

        if (data && data.choices?.[0]?.message?.content) {
          responseText = data.choices[0].message.content;
        } else {
          responseText = getAiResponse(text);
        }
      } else {
        responseText = "Mohon masukkan Groq API Key Anda di kolom pengaturan di atas agar AI dapat menganalisis dan meracik obat secara dinamis untuk Anda.";
      }

      const aiMsg: Message = {
        sender: "ai",
        text: responseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const fallbackResponse = `⚠️ **Peringatan Sistem**: ${err.message || 'Terjadi kesalahan'}\n\nSilakan hubungi administrator klinik jika terjadi masalah pada koneksi AI Medis.`;
      
      const aiMsg: Message = {
        sender: "ai",
        text: fallbackResponse,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsTyping(false);
    }
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
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Asisten AI Serbaguna</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Pengetahuan Umum, Sains, Medis & Operasional Klinik</div>
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
              placeholder="Tanyakan apa saja (Ibu Kota Indonesia, Sejarah, Sains, Medis, dll)..."
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
