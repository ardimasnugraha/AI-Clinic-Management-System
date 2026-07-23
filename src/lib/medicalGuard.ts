// src/lib/medicalGuard.ts

/**
 * Simple guard to ensure the AI does not give prescription‑only advice.
 * Returns an object with either {allowed: true, disclaimer?: string}
 * or {allowed: false, message: string}
 */
export function guard(question: string): { allowed: boolean; message?: string; disclaimer?: string } {
  const lowered = question.toLowerCase();

  // Keywords that indicate a request for prescription medication.
  const prescriptionKeywords = [
    'berapa',
    'dosis',
    'resep',
    'obat resep',
    'preskripsi',
    'berapa banyak',
    'apakah boleh',
    'harus',
  ];

  const containsPrescription = prescriptionKeywords.some((kw) => lowered.includes(kw));

  if (containsPrescription) {
    return {
      allowed: false,
      message:
        'Maaf, saya tidak dapat memberikan saran dosis atau resep obat. Silakan konsultasikan dengan dokter atau apoteker terdekat.',
    };
  }

  // General disclaimer for health information.
  const disclaimer =
    'Informasi yang diberikan bersifat umum dan bukan pengganti konsultasi medis profesional. Selalu konsultasikan dengan tenaga kesehatan yang berwenang.';

  return { allowed: true, disclaimer };
}
