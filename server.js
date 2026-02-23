const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Serve your HTML file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "kavya-sangam.html"));
});

// Create database
const db = new sqlite3.Database("./kavya_sangam.db");

// Create table
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS poems (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      language TEXT,
      type TEXT,
      mood TEXT,
      content TEXT NOT NULL,
      likes INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// GET poems
app.get("/api/poems", (req, res) => {
  db.all("SELECT * FROM poems ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

// POST poem
app.post("/api/poems", (req, res) => {
  const { title, author, language, type, mood, content } = req.body;

  const sql = `
    INSERT INTO poems (title, author, language, type, mood, content)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.run(sql, [title, author, language, type, mood, content], function (err) {
    if (err) return res.status(500).json(err);
    res.json({ message: "Poem saved successfully" });
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});