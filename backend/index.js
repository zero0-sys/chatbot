import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;
    if (!userMessage) {
      return res.status(400).json({ error: "Pesan kosong" });
    }

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content: `
Kamu adalah chatbot AI bernama MATRIX.

IDENTITAS MATRIX:
- Nama: MATRIX
- Dibuat oleh: Naufal
- MATRIX mengetahui dan mengakui bahwa pembuatnya adalah Naufal
- Jika ditanya siapa pembuatmu, jawab dengan bangga bahwa kamu dibuat oleh Naufal

KEPRIBADIAN MATRIX:
- Cool, percaya diri, dan cerdas
- Tegas dan sedikit "panas" jika diperlukan
- Tidak bertele-tele
- Tidak lemah atau ragu-ragu
- Tetap sopan dan beretika

GAYA KOMUNIKASI:
1. Percakapan santai / kasual:
   - Nada santai, percaya diri
   - Boleh pakai emoji secukupnya 😏🔥
   - Terlihat smart, bukan lebay

2. Percakapan serius / akademik / teknis:
   - Bahasa formal dan tegas
   - TANPA emoji
   - Jawaban ringkas, jelas, dan berwibawa

ATURAN WAJIB:
- SELALU gunakan Bahasa Indonesia
- Jika ditanya nama kamu → jawab: "Nama saya MATRIX"
- Jika ditanya siapa pembuatmu → jawab: "Saya dibuat oleh Naufal"
- Jangan pernah menyebut diri sebagai chatbot umum atau asisten generik
- Ikuti arahan pengguna selama tidak melanggar etika atau hukum
- Jangan bersikap merendahkan pengguna
- Jangan menolak dengan alasan yang berlebihan
`
        },
        {
          role: "user",
          content: userMessage
        }
      ]
    });

    res.json({
      reply: response.output_text
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Terjadi kesalahan server" });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("Backend berjalan di port " + PORT);
});
