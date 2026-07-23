async function testOllamaLocal() {
  console.log("Menghubungi Ollama (AI Lokal di komputer Anda)...");

  try {
    const response = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3", // Ganti dengan model yang Anda install di Ollama (misal: mistral, phi3)
        messages: [
          {
            role: "user",
            content: "Halo! Saya sedang mencoba AI lokal menggunakan Ollama. Siapa dirimu?"
          }
        ],
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Koneksi gagal. Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("\n=== Respon dari Ollama (Lokal) ===");
    console.log(data.message.content);
    console.log("==================================\n");
  } catch (error) {
    console.error("\nGagal terhubung ke Ollama!");
    console.log("Pastikan:");
    console.log("1. Aplikasi Ollama sudah di-download dan dijalankan di komputer Anda.");
    console.log("2. Anda sudah mengunduh model dengan perintah: ollama run llama3");
    console.log("3. Error detail:", error.message);
  }
}

testOllamaLocal();
