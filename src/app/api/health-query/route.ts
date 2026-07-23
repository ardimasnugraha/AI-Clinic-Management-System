// src/app/api/health-query/route.ts
import { NextResponse } from 'next/server';
import { search } from '@/lib/search';
import { guard } from '@/lib/medicalGuard';

/**
 * POST /api/health-query
 * Expects JSON body: { question: string }
 * Returns JSON: { answer?: string, error?: string }
 */
export async function POST(req: Request) {
  try {
    const { question } = await req.json();
    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Invalid request. "question" must be a non‑empty string.' }, { status: 400 });
    }

    // Guard against disallowed prescription queries
    const guardResult = guard(question);
    if (!guardResult.allowed) {
      return NextResponse.json({ error: guardResult.message }, { status: 403 });
    }

    // Perform a Google search for up‑to‑date health information
    const { snippets, urls } = await search(question);

    // Build a concise answer using the snippets
    const compiled = snippets.length
      ? `Berikut rangkuman hasil pencarian untuk pertanyaan Anda:\n\n${snippets.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
      : 'Tidak menemukan hasil yang relevan.';

    // Append a disclaimer for safety
    const answer = guardResult.disclaimer ? `${compiled}\n\n${guardResult.disclaimer}` : compiled;

    return NextResponse.json({ answer }, { status: 200 });
  } catch (e: any) {
    console.error('Health query error:', e);
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}
