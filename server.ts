import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// ---------------------------------------------------------
// SERVER-SIDE UTILITY ENDPOINTS
// ---------------------------------------------------------

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mode: process.env.NODE_ENV });
});

// GTMOS Endpoints removed

// Enrichment logic removed
// Enrichment logic removed

// ---------------------------------------------------------
// COGNITIVE GTM REASONING ENGINE ENHANCEMENTS
// ---------------------------------------------------------

// Strategic reasoning logic removed

// GTM Strategy generation removed

// GTM Draft generation removed

// GTMOS AI endpoints removed

// Remaining AI endpoints and local compute functions removed

// ---------------------------------------------------------
// VITE OR STATIC ASSETS SERVING MIDDLEWARE
// ---------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    // Production mode
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[RevOS Backend Active] Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Critical server startup failure:", err);
});
