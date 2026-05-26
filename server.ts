import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from "fs";

// We'll store the link in-memory for this simple prototype.
// Normally, this would be in a database.
let currentZoomLink = "https://zoom.us/join";
const ADMIN_CODE = process.env.ADMIN_CODE || "12345";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/zoom-link", (req, res) => {
    res.json({ link: currentZoomLink });
  });

  app.post("/api/verify", (req, res) => {
    const { code } = req.body;
    if (code === ADMIN_CODE) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, error: "Invalid admin code" });
    }
  });

  app.post("/api/zoom-link", (req, res) => {
    const { link, code } = req.body;
    
    if (code !== ADMIN_CODE) {
      return res.status(401).json({ error: "Unauthorized: Invalid code" });
    }

    if (typeof link === "string") {
      currentZoomLink = link;
      res.json({ success: true, link: currentZoomLink });
    } else {
      res.status(400).json({ error: "Invalid link format" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
