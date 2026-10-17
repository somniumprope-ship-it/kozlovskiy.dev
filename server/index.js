// Сервер сайта: отдаёт собранный фронт, хранит контент (JSON) и загруженные файлы.
// Запуск: `npm start` (после `npm run build`). Настройки — через переменные окружения, см. .env.example
import express from "express";
import multer from "multer";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const PORT = Number(process.env.PORT || 3001);
const IS_PROD = process.env.NODE_ENV === "production";
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(ROOT, "data"));
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const CONTENT_FILE = path.join(DATA_DIR, "content.json");
const SUBSCRIBERS_FILE = path.join(DATA_DIR, "subscribers.jsonl");
const DIST_DIR = path.join(ROOT, "dist");
const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB || 200);

let ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
  if (IS_PROD) {
    console.error("ADMIN_PASSWORD не задан. В production сервер без пароля админки не запускается.");
    process.exit(1);
  }
  ADMIN_PASSWORD = "admin";
  console.warn("[dev] ADMIN_PASSWORD не задан — пароль админки: admin");
}

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Секрет для подписи токенов: из env или сохранённый между перезапусками
function loadSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  const file = path.join(DATA_DIR, ".secret");
  try {
    return fs.readFileSync(file, "utf8").trim();
  } catch {
    const s = crypto.randomBytes(32).toString("hex");
    fs.writeFileSync(file, s, { mode: 0o600 });
    return s;
  }
}
const SECRET = loadSecret();

const defaults = JSON.parse(fs.readFileSync(path.join(__dirname, "defaultContent.json"), "utf8"));

// ---------- контент ----------
const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
function merge(base, extra) {
  if (!isObj(base) || !isObj(extra)) return extra === undefined ? base : extra;
  const out = { ...base };
  for (const k of Object.keys(extra)) out[k] = k in base ? merge(base[k], extra[k]) : extra[k];
  return out;
}

function readContent() {
  try {
    return merge(defaults, JSON.parse(fs.readFileSync(CONTENT_FILE, "utf8")));
  } catch {
    return structuredClone(defaults);
  }
}

function writeContent(content) {
  const tmp = `${CONTENT_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(content, null, 2));
  fs.renameSync(tmp, CONTENT_FILE); // атомарно: сайт никогда не прочитает половину файла
}

// Удаляет загруженные файлы, на которые больше нет ссылок в контенте.
// Файлы младше суток не трогаем — их могли только что загрузить, но ещё не сохранить.
function cleanupUploads(contentJson) {
  const DAY = 24 * 60 * 60 * 1000;
  for (const name of fs.readdirSync(UPLOAD_DIR)) {
    if (contentJson.includes(`/uploads/${name}`)) continue;
    const file = path.join(UPLOAD_DIR, name);
    try {
      if (Date.now() - fs.statSync(file).mtimeMs > DAY) fs.rmSync(file, { force: true });
    } catch {
      /* файл уже удалён */
    }
  }
}

// ---------- авторизация ----------
const TOKEN_TTL = 1000 * 60 * 60 * 12;
const sign = (payload) => crypto.createHmac("sha256", SECRET).update(payload).digest("hex");

function makeToken() {
  const exp = String(Date.now() + TOKEN_TTL);
  return `${exp}.${sign(exp)}`;
}

function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

function verifyToken(token) {
  if (typeof token !== "string") return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return safeEqual(sig, sign(exp));
}

function requireAuth(req, res, next) {
  const m = /^Bearer (.+)$/.exec(req.headers.authorization || "");
  if (m && verifyToken(m[1])) return next();
  res.status(401).json({ error: "unauthorized" });
}

const attempts = new Map(); // ip -> { n, reset }
function loginLimiter(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || rec.reset < now) attempts.set(ip, { n: 0, reset: now + 15 * 60 * 1000 });
  if (attempts.get(ip).n >= 10) return res.status(429).json({ error: "too_many_attempts" });
  next();
}

// ---------- загрузка файлов ----------
const MEDIA = {
  ".jpg": "image", ".jpeg": "image", ".png": "image", ".webp": "image",
  ".avif": "image", ".gif": "image", ".svg": "image",
  ".mp4": "video", ".webm": "video",
};

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now().toString(36)}-${crypto.randomBytes(5).toString("hex")}${ext}`);
    },
  }),
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024, files: 40 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, ext in MEDIA);
  },
});

// ---------- приложение ----------
const app = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

app.use(
  "/uploads",
  express.static(UPLOAD_DIR, {
    maxAge: "365d",
    immutable: true,
    index: false,
    setHeaders: (res) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; sandbox");
    },
  }),
);

app.get("/api/content", (_req, res) => {
  res.setHeader("Cache-Control", "no-cache");
  res.json(readContent());
});

app.post("/api/login", loginLimiter, (req, res) => {
  const ok = safeEqual(req.body?.password ?? "", ADMIN_PASSWORD);
  if (!ok) {
    attempts.get(req.ip).n += 1;
    return res.status(401).json({ error: "bad_password" });
  }
  attempts.delete(req.ip);
  res.json({ token: makeToken() });
});

app.get("/api/session", requireAuth, (_req, res) => res.json({ ok: true }));

app.put("/api/content", requireAuth, (req, res) => {
  const body = req.body;
  if (!isObj(body) || !isObj(body.left) || !isObj(body.right) || !isObj(body.site)) {
    return res.status(400).json({ error: "bad_content" });
  }
  if (!Array.isArray(body.right.tiles) || !Array.isArray(body.left.works)) {
    return res.status(400).json({ error: "bad_content" });
  }
  const content = merge(defaults, body);
  writeContent(content);
  cleanupUploads(JSON.stringify(content));
  res.json({ ok: true });
});

app.post("/api/upload", requireAuth, upload.array("files", 40), (req, res) => {
  const files = (req.files || []).map((f) => ({
    src: `/uploads/${f.filename}`,
    type: MEDIA[path.extname(f.filename)],
    size: f.size,
    name: f.originalname,
  }));
  res.json({ files });
});

app.delete("/api/upload/:file", requireAuth, (req, res) => {
  const name = path.basename(req.params.file); // защита от ../
  fs.rm(path.join(UPLOAD_DIR, name), { force: true }, () => res.json({ ok: true }));
});

app.post("/api/subscribe", (req, res) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  if (!/^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/.test(email)) {
    return res.status(400).json({ error: "bad_email" });
  }
  fs.appendFileSync(SUBSCRIBERS_FILE, JSON.stringify({ email, at: new Date().toISOString() }) + "\n");
  res.json({ ok: true });
});

app.get("/api/subscribers", requireAuth, (_req, res) => {
  let rows = [];
  try {
    rows = fs.readFileSync(SUBSCRIBERS_FILE, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
  } catch {
    /* файла ещё нет */
  }
  res.json({ subscribers: rows });
});

app.use("/api", (_req, res) => res.status(404).json({ error: "not_found" }));

// ---------- фронт (production) ----------
if (fs.existsSync(path.join(DIST_DIR, "index.html"))) {
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const template = fs.readFileSync(path.join(DIST_DIR, "index.html"), "utf8");

  app.use("/assets", express.static(path.join(DIST_DIR, "assets"), { maxAge: "365d", immutable: true }));
  app.use(express.static(DIST_DIR, { index: false, maxAge: "1h" }));

  app.get("*", (_req, res) => {
    const content = readContent();
    // Контент вшивается в страницу — сайт рисуется сразу, без запроса и мигания дефолтных текстов
    const json = JSON.stringify(content).replace(/</g, "\\u003c");
    const html = template
      .replace(/<title>.*?<\/title>/, `<title>${esc(content.site.title)}</title>`)
      .replace("</head>", `<script>window.__CONTENT__=${json}</script></head>`);
    res.setHeader("Cache-Control", "no-cache");
    res.type("html").send(html);
  });
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.code === "LIMIT_FILE_SIZE" ? 413 : 500).json({ error: err.code || "server_error" });
});

app.listen(PORT, () => {
  console.log(`API:  http://localhost:${PORT}`);
  console.log(`Данные: ${DATA_DIR}`);
});
