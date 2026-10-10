
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;

// Firebase credentials: Render Secret File
const secretFile = "/etc/secrets/serviceAccountKey.json";

if (!fs.existsSync(secretFile)) {
  throw new Error(
    "Firebase Secret File not found. Add serviceAccountKey.json in Render > Environment > Secret Files."
  );
}

const serviceAccount = JSON.parse(
  fs.readFileSync(secretFile, "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const poemsCollection = db.collection("poems");

app.use(cors());
app.use(express.json());

// Serve frontend files if the public folder exists
const publicFolder = path.join(__dirname, "public");

if (fs.existsSync(publicFolder)) {
  app.use(express.static(publicFolder));
}

// Home route
app.get("/", (req, res) => {
  const indexFile = path.join(publicFolder, "index.html");

  if (fs.existsSync(indexFile)) {
    return res.sendFile(indexFile);
  }

  res.send("Kavya Sangam Firebase server is running!");
});

// Format a poem for the frontend
function formatPoem(doc) {
  const data = doc.data();
  const createdAt = data.createdAt;

  let date = data.date || "";

  if (createdAt && typeof createdAt.toDate === "function") {
    date = createdAt.toDate().toLocaleDateString("en-IN");
  }

  return {
    ...data,
    id: data.id ?? doc.id,
    docId: doc.id,
    lang: data.language || "Marathi",
    body: data.content || "",
    date,
    likes: data.likes || 0,
    comments: data.comments || [],
  };
}

// GET: fetch all poems
app.get("/api/poems", async (req, res) => {
  try {
    const snapshot = await poemsCollection
      .orderBy("createdAt", "desc")
      .get();

    res.json(snapshot.docs.map(formatPoem));
  } catch (error) {
    console.error("Fetch poems error:", error.message);
    res.status(500).json({
      message: "Failed to fetch poems",
    });
  }
});

// POST: save a new poem
app.post("/api/poems", async (req, res) => {
  try {
    const { title, author, language, type, mood, content } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof author !== "string" ||
      !author.trim() ||
      typeof content !== "string" ||
      !content.trim()
    ) {
      return res.status(400).json({
        message: "Title, author and content are required",
      });
    }

    const poem = {
      id: Date.now(),
      title: title.trim(),
      author: author.trim(),
      language: language || "Marathi",
      type: type || "Poem",
      mood: mood || "Thoughtful",
      content: content.trim(),
      likes: 0,
      comments: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await poemsCollection.add(poem);
    const savedDoc = await docRef.get();

    res.status(201).json(formatPoem(savedDoc));
  } catch (error) {
    console.error("Save poem error:", error.message);
    res.status(500).json({
      message: "Failed to save poem",
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Kavya Sangam server running on port ${PORT}`);
});
