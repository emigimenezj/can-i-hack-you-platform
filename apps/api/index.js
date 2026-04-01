import express from "express";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const port = Number(process.env.PORT) || 3001;
const host = process.env.HOST || "0.0.0.0";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webDist = path.resolve(__dirname, "../web/dist");

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.sendStatus(204);

  next();
});

const createLimiter = (maxRequests, message) =>
  rateLimit({
    windowMs: 60 * 1000,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: message },
  });

const healthLimiter = createLimiter(
  Number(process.env.RATE_LIMIT_HEALTH_MAX) || 120,
  "Too many health checks. Please try again later.",
);

const eventsLimiter = createLimiter(
  Number(process.env.RATE_LIMIT_EVENTS_MAX) || 60,
  "Too many event stream connection attempts. Please try again later.",
);

const collectLimiter = createLimiter(
  Number(process.env.RATE_LIMIT_COLLECT_MAX) || 30,
  "Too many collect requests. Please try again later.",
);

app.get("/health", healthLimiter, (req, res) => {
  res.json({ ok: true });
});

const clients = new Map();

app.get("/events/:sessionID", eventsLimiter, (req, res) => {
  const { sessionID } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const isClientPresent = clients.has(sessionID);
  if (!isClientPresent) clients.set(sessionID, new Set());

  clients.get(sessionID).add(res);

  res.write(`event: connected\n`);
  res.write(`data: ${JSON.stringify({ ok: true, sessionID })}\n\n`);

  const heartbeat = setInterval(() => {
    res.write(`: ping\n\n`);
  }, 15000);

  req.on("close", () => {
    clearInterval(heartbeat);

    const sessionClients = clients.get(sessionID);
    if (!sessionClients) return;

    sessionClients.delete(res);
    if (sessionClients.size === 0) clients.delete(sessionID);
  });
});

app.post("/collect", collectLimiter, (req, res) => {
  const { vector, sessionID, timestamp } = req.body ?? {};

  if (typeof sessionID !== "string" || sessionID.trim() === "") {
    return res.status(400).json({ error: "sessionID is required" });
  }

  if (typeof vector !== "string" || vector.trim() === "") {
    return res.status(400).json({ error: "vector is required" });
  }

  const sessionClients = clients.get(sessionID);

  if (sessionClients) {
    const payload = {
      vector,
      sessionID,
      timestamp: timestamp ?? new Date().toISOString(),
    };

    for (const client of sessionClients) {
      client.write(`event: attack\n`);
      client.write(`data: ${JSON.stringify(payload)}\n\n`);
    }
  }

  res.json({ received: true });
});

// Servir Astro build
app.use(express.static(webDist));

app.get("/", (_req, res) => {
  res.sendFile(path.join(webDist, "index.html"));
});

app.get("/attacks", (_req, res) => {
  res.sendFile(path.join(webDist, "attacks", "index.html"));
});

app.get("/session", (_req, res) => {
  res.sendFile(path.join(webDist, "session", "index.html"));
});

app.listen(port, host, () => {
  console.log(`App running on http://${host}:${port}`);
});
