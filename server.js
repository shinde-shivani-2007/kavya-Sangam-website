const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// Supabase setup
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

app.use(cors());
app.use(express.json());

// Serve frontend
app.use(express.static(__dirname));

/* =========================
   GET ALL POEMS
========================= */
app.get("/api/poems", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("poems")
      .select("*")
      .order("id", { ascending: false });

    if (error) throw error;

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

    // Basic validation
    if (!title || !author || !content) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const { data, error } = await supabase
      .from("poems")
      .insert([{ title, author, language, type, mood, content }]);

    if (error) throw error;

    res.json({ message: "Poem saved successfully" });
  } catch (err) {
    console.error("POST ERROR:", err.message);
    res.status(500).json({ error: "Failed to save poem" });
  }
});

/* =========================
   START SERVER
========================= */
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
