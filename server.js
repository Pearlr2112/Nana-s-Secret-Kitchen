const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 3000);
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const BASE_URL = "https://generativelanguage.googleapis.com/v1";
const PUBLIC_DIR = path.resolve(__dirname);

if (!API_KEY) {
  console.error("Missing GEMINI_API_KEY environment variable.");
  process.exit(1);
}

const mimeTypes = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function sendResponse(res, status, body, type = "application/json") {
  res.writeHead(status, {
    "Content-Type": type,
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(body);
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let pathname = url.pathname === "/" ? "/snapshot.html" : url.pathname;
  const filePath = path.normalize(path.join(PUBLIC_DIR, pathname));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    return sendResponse(res, 403, "Forbidden", "text/plain");
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) return sendResponse(res, 404, "Not Found", "text/plain");
    const ext = path.extname(filePath).toLowerCase();
    const type = mimeTypes[ext] || "application/octet-stream";
    fs.readFile(filePath, (readErr, data) => {
      if (readErr) return sendResponse(res, 500, "Server Error", "text/plain");
      sendResponse(res, 200, data, type);
    });
  });
}

async function proxyGemini(req, res) {
  let body = "";
  for await (const chunk of req) body += chunk;

  let json;
  try {
    json = JSON.parse(body);
  } catch {
    return sendResponse(res, 400, JSON.stringify({ error: "Invalid JSON body" }));
  }

  try {
    const apiRes = await fetch(`${BASE_URL}/models/${MODEL}:generate?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(json)
    });

    const text = await apiRes.text();
    sendResponse(res, apiRes.status, text, "application/json");
  } catch (err) {
    sendResponse(res, 502, JSON.stringify({ error: err.message }));
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  console.log(`${req.method} ${url.pathname}`);

  if (url.pathname === "/api/gemini" || url.pathname === "/api/gemini/") {
    if (req.method === "OPTIONS") return sendResponse(res, 204, "");
    if (req.method === "POST") return proxyGemini(req, res);
    return sendResponse(res, 405, "Method Not Allowed", "text/plain");
  }

  serveStatic(req, res);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at http://127.0.0.1:${PORT}`);
});