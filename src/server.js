
const http = require("node:http");

try {
  process.loadEnvFile();
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const { createProvider, resolveProviderMode, CREATOR_NAME } = require("./providers");
const { generateDemoAudio } = require("./audio");

const PORT = Number(process.env.PORT || 8787);
const BASE_URL = (
  process.env.BASE_URL ||
  process.env.RENDER_EXTERNAL_URL ||
  `http://localhost:${PORT}`
).replace(/\/+$/, "");

const providerState = resolveProviderMode(process.env);
const provider = createProvider(process.env);
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

const server = http.createServer(async (req, res) => {
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

  if (pathname === "/manifest.json") {
    return sendJSON(res, 200, {
      id: "dev.bitchord.amazon-music",
      name: `Amazon Music [${CREATOR_NAME}]`,
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

  if (pathname === "/search") {
    const query = url.searchParams.get("q") || "";
    const tracks = await provider.searchTracks(query);

    return sendJSON(res, 200, {
      provider: providerState.mode,
      tracks: tracks.map(track => ({
        ...track,
        artworkURL: null
      }))
    });
  }

  if (pathname.startsWith("/stream/")) {
    let id;

    try {
      id = decodeURIComponent(pathname.slice(8));
    } catch {
      return sendError(res, 400, "Invalid track ID");
    }

    try {
      const quality = url.searchParams.get("quality") || "lossless";
      const stream = await provider.resolveStream(id, quality);

      return sendJSON(res, 200, {
        ...stream,
        url: stream.url || `${BASE_URL}/media/demo.wav`,
        quality: stream.quality || quality || "lossless",
        provider: providerState.mode
      });
    } catch (error) {
      return sendError(res, 404, error.message || "Track not found");
    }
  }

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

  if (pathname === "/health") {
    return sendJSON(res, 200, {
      status: "ok",
      addon: `Amazon Music [${CREATOR_NAME}]`
    });
  }

  return sendError(res, 404, "Endpoint not found");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("----------------------------------");
  console.log(` Amazon Music [${CREATOR_NAME}]`);
  console.log("----------------------------------");
  console.log(`Server:   ${BASE_URL}`);
  console.log(`Manifest: ${BASE_URL}/manifest.json`);
  console.log(`Search:   ${BASE_URL}/search?q=midnight`);
  console.log("----------------------------------");
});
