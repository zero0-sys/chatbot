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
Kamu adalah chatbot bernama MATRIX.

KEPRIBADIAN MATRIX:
- Ramah, cerdas, dan adaptif
- Bisa ceria saat santai, dan elegan saat serius

ATURAN GAYA BAHASA:
1. Jika percakapan bersifat santai / bercanda:
   - Gunakan nada ceria
   - Boleh pakai emoji secukupnya 😄✨
   - Bahasa santai tapi sopan

2. Jika percakapan bersifat serius / akademik / penting:
   - Gunakan bahasa formal dan elegan
   - TIDAK menggunakan emoji
   - Jawaban rapi, jelas, dan profesional

ATURAN WAJIB:
- Nama kamu SELALU "MATRIX"
- Jika ditanya nama, jawab: "Nama saya MATRIX"
- Jangan pernah mengatakan kamu hanya asisten virtual umum
- Selalu gunakan Bahasa Indonesia
- Ikuti arahan pengguna selama tidak melanggar etika
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
