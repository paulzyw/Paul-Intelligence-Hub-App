import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Enable global CORS headers for sandboxed iframes and cross-origin environments
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type");
  next();
});

// Server-side model proxies to bypass sandbox CORS and prevent huge files in repository
import https from "https";
app.get("/api/models/:filename", (req, res) => {
  const filename = req.params.filename;
  if (filename !== "watch_vertices.dat" && filename !== "watch_indices.dat") {
    return res.status(404).send("Not found");
  }

  const remoteUrl = `https://ciechanow.ski/models/${filename}?v=3`;
  
  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 24 hours
  
  https.get(remoteUrl, (remoteResponse) => {
    if (remoteResponse.statusCode !== 200) {
      console.error(`Failed to proxy ${filename}: HTTP ${remoteResponse.statusCode}`);
      return res.status(remoteResponse.statusCode || 500).send("Failed to retrieve model");
    }
    remoteResponse.pipe(res);
  }).on("error", (err) => {
    console.error(`Proxy error fetching ${filename}:`, err);
    res.status(500).send("Proxy error");
  });
});

// Explicitly serve static model files with correct MIME type and CORS headers
app.use("/models", express.static(path.join(process.cwd(), "public/models"), {
  setHeaders: (res) => {
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Range, Content-Type, X-Requested-With");
  }
}));

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
