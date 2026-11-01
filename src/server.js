
const http = require("node:http");

try {
  process.loadEnvFile();
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const { searchTracks, getTrack } = require("./catalogue");
const { generateDemoAudio } = require("./audio");

const PORT = Number(process.env.PORT || 8787);
const BASE_URL = (
  process.env.BASE_URL ||
  process.env.RENDER_EXTERNAL_URL ||
  `http://localhost:${PORT}`
).replace(/\/+$/, "");

const demoAudio = generateDemoAudio();

function sendJSON(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*"
  });
  res.end(JSON.stringify(data));
}

function sendError(res, status, message) {
  sendJSON(res, status, { error: message });
}

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    return sendError(res, 405, "Method not allowed");
  }

  const url = new URL(req.url, BASE_URL);
  const pathname = url.pathname;

  // 1. Manifest
  if (pathname === "/manifest.json") {
    return sendJSON(res, 200, {
      id: "dev.bitchord.amazon-music",
      name: "Amazon Music Preview",
      version: "1.0.0",
      resources: ["search", "stream"],
      allowDownloads: 0,
      settings: [
        {
          key: "quality",
          type: "select",
          default: "lossless",
          options: [
            { label: "Lossless", value: "lossless" },
            { label: "High", value: "high" },
            { label: "Low", value: "low" }
          ]
        }
      ]
    });
  }

  // 2. Search
  if (pathname === "/search") {
    const query = url.searchParams.get("q") || "";
    const tracks = searchTracks(query);

    return sendJSON(res, 200, {
      tracks: tracks.map(track => ({
        ...track,
        artworkURL: null
      }))
    });
  }

  // 3. Stream resolution
  if (pathname.startsWith("/stream/")) {
    let id;

    try {
      id = decodeURIComponent(pathname.slice(8));
    } catch {
      return sendError(res, 400, "Invalid track ID");
    }

    const track = getTrack(id);

    if (!track) {
      return sendError(res, 404, "Track not found");
    }

    return sendJSON(res, 200, {
      url: `${BASE_URL}/media/demo.wav`,
      format: "wav",
      quality: "Synthetic demo · PCM 16-bit / 44.1 kHz",
      codec: "pcm_s16le",
      container: "wav",
      manifest: "none",
      encrypted: false,
      sampleRate: 44100,
      bitDepth: 16,
      bitrate: 705600
    });
  }

  // Demo audio
  if (pathname === "/media/demo.wav") {
    res.writeHead(200, {
      "Content-Type": "audio/wav",
      "Content-Length": demoAudio.length,
      "Cache-Control": "public, max-age=3600",
      "Accept-Ranges": "bytes"
    });

    if (req.method === "HEAD") return res.end();

    return res.end(demoAudio);
  }

  // Health check
  if (pathname === "/health") {
    return sendJSON(res, 200, {
      status: "ok",
      addon: "Amazon Music Preview",
      mode: "mock"
    });
  }

  return sendError(res, 404, "Endpoint not found");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("----------------------------------");
  console.log(" BitChord Amazon Music Preview");
  console.log("----------------------------------");
  console.log(`Server:   ${BASE_URL}`);
  console.log(`Manifest: ${BASE_URL}/manifest.json`);
  console.log(`Search:   ${BASE_URL}/search?q=midnight`);
  console.log(`Mode:     MOCK CATALOGUE`);
  console.log("----------------------------------");
});
