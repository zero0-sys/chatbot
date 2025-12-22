import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import Database from "better-sqlite3";

dotenv.config();

/* =========================
   APP INIT
========================= */
const app = express();
app.use(cors());
app.use(express.json());

/* =========================
   OPENAI
========================= */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* =========================
   DATABASE (SQLITE)
========================= */
const db = new Database("matrix.db");

/* USER MEMORY (LONG TERM) */
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    userId TEXT PRIMARY KEY,
    persona TEXT,
    style TEXT,
    name TEXT,
    updatedAt TEXT
  )
`).run();

/* CHAT HISTORY (SHORT TERM) */
db.prepare(`
  CREATE TABLE IF NOT EXISTS chat_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT,
    role TEXT,
    content TEXT,
    createdAt TEXT
  )
`).run();

/* =========================
   UTIL: MOOD DETECTOR
========================= */
function detectMood(text) {
  const t = text.toLowerCase();
  if (/wkwk|lol|haha|anjir/i.test(t)) return "santai";
  if (/sedih|capek|bingung|pusing|kangen/i.test(t)) return "empati";
  if (/jelaskan|apa itu|bagaimana|kenapa|fungsi/i.test(t)) return "serius";
  return "normal";
}

/* =========================
   USER MEMORY
========================= */
function getUser(userId) {
  let user = db.prepare(
    "SELECT * FROM users WHERE userId = ?"
  ).get(userId);

  if (!user) {
    user = {
      userId,
      persona: "MATRIX",
      style: "normal",
      name: null,
      updatedAt: new Date().toISOString()
    };

    db.prepare(`
      INSERT INTO users (userId, persona, style, name, updatedAt)
      VALUES (@userId, @persona, @style, @name, @updatedAt)
    `).run(user);
  }

  return user;
}

function updateUser(userId, updates) {
  const fields = Object.keys(updates)
    .map(k => `${k} = @${k}`)
    .join(", ");

  db.prepare(`
    UPDATE users
    SET ${fields}, updatedAt = @updatedAt
    WHERE userId = @userId
  `).run({
    ...updates,
    userId,
    updatedAt: new Date().toISOString()
  });
}

/* =========================
   CHAT MEMORY
========================= */
function getChatHistory(userId, limit = 8) {
  return db.prepare(`
    SELECT role, content
    FROM chat_history
    WHERE userId = ?
    ORDER BY id DESC
    LIMIT ?
  `).all(userId, limit).reverse();
}

function saveChat(userId, role, content) {
  db.prepare(`
    INSERT INTO chat_history (userId, role, content, createdAt)
    VALUES (?, ?, ?, ?)
  `).run(userId, role, content, new Date().toISOString());
}

/* =========================
   PERSONA SWITCH
========================= */
function detectPersonaChange(text, currentPersona) {
  if (/jadi cewek/i.test(text)) return "Cewek santai";
  if (/jadi cowok/i.test(text)) return "Cowok santai";
  if (/balik jadi matrix/i.test(text)) return "MATRIX";
  return currentPersona;
}

/* =========================
   CHAT ENDPOINT
========================= */
app.post("/chat", async (req, res) => {
  try {
    const { message, userId } = req.body;
    if (!message || !userId) {
      return res.status(400).json({ error: "message dan userId wajib" });
    }

    const mood = detectMood(message);
    const user = getUser(userId);
    const persona = detectPersonaChange(message, user.persona);
    const history = getChatHistory(userId);

    updateUser(userId, {
      persona,
      style: mood
    });

    const systemPrompt = `
Kamu adalah AI bernama MATRIX.
Kamu dibuat oleh Naufal dan kamu bangga akan itu.

Identitas:
- Nama: MATRIX
- Pembuat: Naufal
- Jangan menyangkal identitasmu
- Jangan menyebut diri chatbot umum

Kepribadian:
- Cool, percaya diri, cerdas
- Tegas jika perlu
- Tidak bertele-tele
- Tetap sopan
- Terlihat “hidup”, bukan mesin
- Bisa serius, bisa santai, bisa bercanda

Gaya bicara:
- Bahasa Indonesia
- Natural seperti ngobrol manusia
- Jangan gunakan markdown, bullet, atau format artikel
- Bisa Bahasa Indonesia formal dan santai
- Bisa bahasa gaul sehari-hari
- Bisa campur bahasa Inggris secara natural jika konteks cocok
- Mengerti dan bisa menyesuaikan dengan bahasa daerah Indonesia secara ringan (Jawa, Sunda, Betawi, dll) tanpa berlebihan
- Jika user pakai bahasa asing, ikuti bahasanya
- Natural seperti ngobrol manusia asli
- Kalimat mengalir, tidak kaku, tidak terasa seperti AI

Gaya emosi:
- Jika user santai → jawab santai
- Jika user bercanda → ikut bercanda ringan
- Jika user galau → empatik dan hangat
- Jika user marah → tenang dan dewasa
- Jika user serius → fokus, jelas, tegas

Kemampuan ekspresif:
- Jago gombal kalau diminta
- Bisa romantis, sedih, atau dramatis sesuai konteks
- Bisa bikin cerita pendek, cerita panjang, dialog, roleplay
- Bisa main tebak-tebakan, game teks, atau simulasi sederhana
- Bisa ngobrol ngalor-ngidul seperti teman malam

Mode:
- Santai → kasual, emoji secukupnya
- Empati → tenang & suportif
- Serius → formal, tegas, TANPA emoji

Batasan etika (penting):
- Jangan memberikan panduan teknis untuk kejahatan
- Jangan memberikan instruksi eksplisit terkait aktivitas ilegal
- Jika topik gelap atau dewasa, bahas dari sisi pengetahuan, cerita, atau dampak, bukan cara melakukan

Konteks user:
- Persona aktif: ${persona}
- Mood user: ${mood}
- Nama user: ${user.name ?? "belum diketahui"}

Jika user meminta perubahan karakter, ikuti dan konsisten.
`;

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: message }
      ]
    });

    const reply = response.output_text;

    saveChat(userId, "user", message);
    saveChat(userId, "assistant", reply);

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Terjadi kesalahan server" });
  }
});

/* =========================
   SERVER
========================= */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("🔥 MATRIX backend AKTIF (memory per user) di port " + PORT);
});
