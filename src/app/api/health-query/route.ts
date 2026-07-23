// src/app/api/health-query/route.ts
import { NextResponse } from 'next/server';
import { guard } from '@/lib/medicalGuard';

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
const GOOGLE_SEARCH_API_KEY = process.env.GOOGLE_SEARCH_API_KEY || '';
const GOOGLE_SEARCH_CX = process.env.GOOGLE_SEARCH_CX || '';

const HEALTH_SYSTEM_PROMPT = `Kamu adalah Asisten AI Kesehatan profesional yang sangat ahli dalam:
- Semua penyakit yang ada di dunia beserta gejala, penyebab, dan pengobatannya
- Tips hidup sehat dan pola makan sehat
- Penjelasan obat-obatan (fungsi, efek samping, interaksi)
- Pencegahan penyakit dan promosi kesehatan
- Informasi medis yang akurat dan terpercaya

Jawablah SELALU dalam Bahasa Indonesia yang ramah, terstruktur, dan mudah dipahami.
Gunakan format yang jelas dengan poin-poin atau nomor urut.
Selalu tambahkan disclaimer bahwa informasi ini bersifat umum dan tidak menggantikan konsultasi dokter.
Jangan pernah memberikan dosis spesifik obat resep — arahkan ke dokter untuk hal tersebut.`;

/**
 * Panggil Gemini API sebagai fallback / sumber utama jawaban kesehatan.
 */
async function askGemini(question: string, context?: string, clientApiKey?: string): Promise<string> {
  const apiKeyToUse = clientApiKey || GEMINI_API_KEY;
  if (!apiKeyToUse) {
    throw new Error('Gemini API key tidak ditemukan. Harap isi NEXT_PUBLIC_GEMINI_API_KEY di .env.local atau masukkan di antarmuka.');
  }

  const userContent = context
    ? `Informasi tambahan dari pencarian web:\n${context}\n\nPertanyaan: ${question}`
    : `Pertanyaan: ${question}`;

  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastError = '';

  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKeyToUse}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: HEALTH_SYSTEM_PROMPT }]
            },
            contents: [{ role: 'user', parts: [{ text: userContent }] }]
          })
        }
      );

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      } else {
        const errData = await res.json().catch(() => ({}));
        lastError = errData?.error?.message || `Status ${res.status}`;
      }
    } catch (e: any) {
      lastError = e.message;
    }
  }

  throw new Error(`Gemini tidak tersedia: ${lastError}`);
}

/**
 * Cari di Google Custom Search (opsional — fallback ke Gemini jika tidak ada key).
 */
async function tryGoogleSearch(query: string): Promise<string | null> {
  if (!GOOGLE_SEARCH_API_KEY || !GOOGLE_SEARCH_CX) return null;

  try {
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.set('key', GOOGLE_SEARCH_API_KEY);
    url.searchParams.set('cx', GOOGLE_SEARCH_CX);
    url.searchParams.set('q', query);
    url.searchParams.set('num', '5');

    const res = await fetch(url.toString());
    if (!res.ok) return null;

    const data = await res.json();
    const items: any[] = data.items || [];
    if (!items.length) return null;

    // Gabungkan snippet dari hasil pencarian
    const snippets = items
      .slice(0, 5)
      .map((item: any, i: number) => `${i + 1}. [${item.title}]\n   ${item.snippet}\n   Sumber: ${item.link}`)
      .join('\n\n');

    return snippets;
  } catch {
    return null;
  }
}

/**
 * POST /api/health-query
 * Body: { question: string }
 * Response: { answer: string } | { error: string }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const question: string = body?.question || '';
    const clientApiKey: string = body?.apiKey || '';

    if (!question.trim()) {
      return NextResponse.json(
        { error: 'Pertanyaan tidak boleh kosong.' },
        { status: 400 }
      );
    }

    // 1. Guard — tolak permintaan dosis resep
    const guardResult = guard(question);
    if (!guardResult.allowed) {
      return NextResponse.json({ answer: guardResult.message }, { status: 200 });
    }

    // 2. Coba ambil data dari Google Custom Search (jika key tersedia)
    const searchSnippets = await tryGoogleSearch(`kesehatan ${question}`);

    // 3. Tanya Gemini — dengan atau tanpa konteks dari Google Search
    const geminiAnswer = await askGemini(question, searchSnippets || undefined, clientApiKey);

    // 4. Tambahkan label sumber jika pakai Google Search
    const sourceLabel = searchSnippets
      ? '\n\n---\n📡 *Jawaban didukung data pencarian web terkini.*'
      : '\n\n---\n🤖 *Jawaban dari AI Kesehatan (model Gemini).*';

    const disclaimer = guardResult.disclaimer
      ? `\n\n⚠️ *${guardResult.disclaimer}*`
      : '';

    return NextResponse.json(
      { answer: `${geminiAnswer}${sourceLabel}${disclaimer}` },
      { status: 200 }
    );
  } catch (e: any) {
    console.error('[health-query] Error:', e?.message || e);
    return NextResponse.json(
      { error: e?.message || 'Terjadi kesalahan pada server. Coba lagi.' },
      { status: 500 }
    );
  }
}
