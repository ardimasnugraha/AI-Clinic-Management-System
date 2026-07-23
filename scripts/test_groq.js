require('dotenv').config({ path: '.env.local' });

async function testGroqAPI() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("Error: GROQ_API_KEY tidak ditemukan di .env.local");
    console.log("Cara mendapatkan API Key Groq Gratis:");
    console.log("1. Buka https://console.groq.com/ dan daftar.");
    console.log("2. Buka menu 'API Keys' dan buat key baru.");
    console.log("3. Masukkan ke .env.local seperti ini: GROQ_API_KEY=gsk_...");
    process.exit(1);
  }

  console.log("Menghubungi Groq API (Format OpenAI)...");

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        // Model populer di Groq yang gratis dan cepat
        model: "llama-3.3-70b-versatile", 
        messages: [
          {
            role: "user",
            content: "Halo! Saya sedang mencoba Groq API secara gratis. Tolong perkenalkan dirimu!"
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, detail: ${errorText}`);
    }

    const data = await response.json();
    console.log("\n=== Respon dari Groq (Llama 3) ===");
    console.log(data.choices[0].message.content);
    console.log("==================================\n");
  } catch (error) {
    console.error("Terjadi kesalahan:", error.message);
  }
}

testGroqAPI();
