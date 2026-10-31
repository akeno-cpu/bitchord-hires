
const config = {
  enabled: process.env.AMAZON_MUSIC_ENABLED === "true",
  clientId: process.env.AMAZON_CLIENT_ID,
  clientSecret: process.env.AMAZON_CLIENT_SECRET
};

function isConfigured() {
  return Boolean(
    config.enabled &&
    config.clientId &&
    config.clientSecret
  );
}

async function searchTracks(query) {
  if (!isConfigured()) {
    throw new Error("Amazon Music API is not configured");
  }

  // Implement using the official API and approved permissions.
  throw new Error("Official Amazon catalogue adapter not implemented");
}

async function resolveStream(trackId, quality) {
  if (!isConfigured()) {
    throw new Error("Amazon Music API is not configured");
  }

  // Only return media authorized for third-party playback.
  throw new Error("Official Amazon playback adapter not implemented");
}

module.exports = {
  isConfigured,
  searchTracks,
  resolveStream
};
