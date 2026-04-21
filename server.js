// Load .env first (VERY IMPORTANT)
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

/* =========================
   SUPABASE SETUP
========================= */
const { createClient } = require("@supabase/supabase-js");

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.error("❌ Missing Supabase ENV variables!");
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

/* =========================
   MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

/* =========================
   HEALTH CHECK (optional)
========================= */
app.get("/", (req, res) => {
  res.send("🚀 Server running with Supabase");
});

/* =========================
   GET ALL POEMS
========================= */
app.get("/api/poems", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("poems")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("Supabase GET error:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error("GET ERROR:", err.message);
    res.status(500).json({ error: "Failed to fetch poems" });
  }
});

/* =========================
   ADD NEW POEM
========================= */
app.post("/api/poems", async (req, res) => {
  try {
    const { title, author, language, type, mood, content } = req.body;

    // Validation
    if (!title || !author || !content) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { data, error } = await supabase
      .from("poems")
      .insert([
        {
          title,
          author,
          language,
          type,
          mood,
          content,
        },
      ])
      .select(); // returns inserted row

    if (error) {
      console.error("Supabase POST error:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json({
      message: "✅ Poem saved successfully",
      data,
    });
  } catch (err) {
    console.error("POST ERROR:", err.message);
    res.status(500).json({ error: "Failed to save poem" });
  }
});

/* =========================
   START SERVER
========================= */
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
