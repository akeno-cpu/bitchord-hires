const DEFAULT_TIMEOUT = 60000;

class ApiConnectionError extends Error {
  constructor(message) {
    super(message);
    this.name = "ApiConnectionError";
  }
}

class InvalidAccessToken extends Error {
  constructor(message) {
    super(message);
    this.name = "InvalidAccessToken";
  }
}

class RateLimitExceeded extends Error {
  constructor(message) {
    super(message);
    this.name = "RateLimitExceeded";
  }
}

class UserBanned extends Error {
  constructor(message) {
    super(message);
    this.name = "UserBanned";
  }
}

function normalizeApiUrl(url = "") {
  const trimmed = String(url || "").trim().replace(/\/+$/, "");
  if (!trimmed) {
    return "http://localhost";
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
}

class API {
  constructor(apiUrl, accessToken = "", timeout = DEFAULT_TIMEOUT) {
    this.apiUrl = normalizeApiUrl(apiUrl);
    this.timeout = timeout;
    this.accessToken = accessToken;
  }

  buildUrl(route) {
    return `${this.apiUrl}/${String(route || "").replace(/^\/+/, "")}`;
  }

  async fetch(route, method = "GET", params = undefined, payload = undefined) {
    const normalizedMethod = String(method).toUpperCase();

    if (!["GET", "POST"].includes(normalizedMethod)) {
      throw new Error(`Unsupported HTTP method: ${normalizedMethod}`);
    }

    const headers = {
      Accept: "application/json"
    };

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    let body;
    let url = this.buildUrl(route);

    if (normalizedMethod === "GET" && params && typeof params === "object") {
      const query = new URLSearchParams();

      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== "") {
          query.append(key, String(value));
        }
      }

      const queryString = query.toString();
      if (queryString) {
        url = `${url}?${queryString}`;
      }
    } else if (normalizedMethod === "POST" && payload && typeof payload === "object") {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(payload);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: normalizedMethod,
        headers,
        body,
        signal: controller.signal
      });

      if (response.status === 401 || response.status === 422) {
        throw new InvalidAccessToken("Invalid or expired access token");
      }

      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After") || "unknown";
        throw new RateLimitExceeded(`Rate limit exceeded. Try after: ${retryAfter} seconds`);
      }

      if (response.status === 403) {
        throw new UserBanned("Forbidden, please check your token status or add new one");
      }

      if (!response.ok) {
        throw new ApiConnectionError(`API request failed with status ${response.status}`);
      }

      const text = await response.text();
      if (!text) {
        return {};
      }

      try {
        return JSON.parse(text);
      } catch {
        return { content: text };
      }
    } catch (error) {
      if (
        error instanceof InvalidAccessToken ||
        error instanceof RateLimitExceeded ||
        error instanceof UserBanned ||
        error instanceof ApiConnectionError
      ) {
        throw error;
      }

      if (error && error.name === "AbortError") {
        throw new ApiConnectionError(`Request timed out while connecting to ${url}`);
      }

      if (error instanceof TypeError) {
        throw new ApiConnectionError(`Network error while connecting to ${url}`);
      }

      throw new ApiConnectionError(`Unexpected error during API request: ${error.message}`);
    } finally {
      clearTimeout(timer);
    }
  }

  getAccountInfo() {
    return this.fetch("account");
  }

  search(query, type = "track", maxResults = 25) {
    return this.fetch("search", "GET", {
      query,
      type,
      max_results: maxResults
    });
  }

  getTrack(trackId) {
    return this.fetch("track", "GET", { id: trackId });
  }

  getAlbum(albumId) {
    return this.fetch("album", "GET", { id: albumId });
  }

  getArtist(artistId) {
    return this.fetch("artist", "GET", { id: artistId });
  }

  getPlaylist(playlistId) {
    return this.fetch("playlist", "GET", { id: playlistId });
  }

  getPlaylistCommunity(playlistId) {
    return this.fetch("community_playlist", "GET", { id: playlistId });
  }

  getPodcastShow(podcastId) {
    return this.fetch("podcast", "GET", { id: podcastId });
  }

  getTrackLyrics(trackId) {
    return this.fetch("lyrics", "GET", { id: trackId });
  }

  getStreamUrls(trackId) {
    return this.fetch("stream_urls", "GET", { id: trackId });
  }

  getWidevineKey(pssh) {
    return this.fetch("widevine_key", "POST", undefined, { pssh });
  }
}

module.exports = {
  API,
  ApiConnectionError,
  InvalidAccessToken,
  RateLimitExceeded,
  UserBanned
};
