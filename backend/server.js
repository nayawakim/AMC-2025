// backend/server.js
import express from "express";
import cors from "cors";
import OpenAI from "openai";
import "dotenv/config";


const app = express();
app.use(cors());
app.use(express.json());

// 🔑 NE PAS mettre ta clé ici !!! On va la mettre dans l'environnement
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "no message sent" });

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Tu es une IA conseillère dans une apocalypse zombie." },
      { role: "user", content: message }
    ]
  });

  res.json({ reply: completion.choices[0].message.content });
});

app.listen(3000, () => {
  console.log("🧠 IA active → http://localhost:3000/chat");
});

