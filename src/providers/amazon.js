
const { API } = require('./api');
const { searchTracks: mockSearchTracks, getTrack: mockGetTrack } = require('../catalogue');

function createClient(env = process.env) {
  const apiUrl = env.AMAZON_API_URL || env.AMAZON_MUSIC_API_URL || env.API_URL;
  const apiToken = env.AMAZON_API_TOKEN || env.AMAZON_ACCESS_TOKEN || env.API_TOKEN || '';

  if (!apiUrl) {
    return null;
  }

  return new API(apiUrl, apiToken, Number(env.API_TIMEOUT || 60000));
}

function normalizeTrack(item) {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const source = item.track || item.item || item.data || item;
  const idValue = source.id || source.track_id || source.trackId || source.uuid || source.slug || 'unknown';
  const title = source.title || source.name || source.track_name || 'Untitled track';
  const artist = source.artist || source.artist_name || source.artistName || source.creator || 'Unknown artist';
  const album = source.album || source.album_name || source.albumTitle || 'Unknown album';
  const duration = Number(source.duration || source.length || source.seconds || 0) || 0;

  return {
    id: String(idValue),
    title,
    artist,
    album,
    duration,
    format: source.format || 'wav',
    audioQuality: source.audioQuality || source.quality || 'LOSSLESS'
  };
}

function isConfigured(env = process.env) {
  const apiUrl = env.AMAZON_API_URL || env.AMAZON_MUSIC_API_URL || env.API_URL;
  const apiToken = env.AMAZON_API_TOKEN || env.AMAZON_ACCESS_TOKEN || env.API_TOKEN;
  const legacy = Boolean(env.AMAZON_MUSIC_ENABLED === 'true' && env.AMAZON_CLIENT_ID && env.AMAZON_CLIENT_SECRET);

  return Boolean(apiUrl && apiToken) || legacy;
}

async function searchTracks(env = process.env, query) {
  const client = createClient(env);
  const fallback = mockSearchTracks(query);

  if (!client) {
    return fallback.map(track => ({ ...track, artworkURL: null }));
  }

  try {
    const response = await client.search(query, 'track', 25);
    const results = Array.isArray(response?.tracks)
      ? response.tracks
      : Array.isArray(response?.results)
        ? response.results
        : Array.isArray(response?.data)
          ? response.data
          : [];

    const mapped = results.map(normalizeTrack).filter(Boolean);
    return mapped.length ? mapped : fallback.map(track => ({ ...track, artworkURL: null }));
  } catch (error) {
    return fallback.map(track => ({ ...track, artworkURL: null }));
  }
}

async function resolveStream(env = process.env, trackId, quality = 'lossless') {
  const fallbackTrack = mockGetTrack(trackId);
  const client = createClient(env);

  if (!fallbackTrack && !client) {
    throw new Error('Track not found');
  }

  if (!client) {
    return {
      url: `${(env.BASE_URL || env.RENDER_EXTERNAL_URL || `http://localhost:${env.PORT || 8787}`).replace(/\/+$/, '')}/media/demo.wav`,
      format: 'wav',
      quality: quality || 'lossless',
      codec: 'pcm_s16le',
      container: 'wav',
      manifest: 'none',
      encrypted: false,
      sampleRate: 44100,
      bitDepth: 16,
      bitrate: 705600
    };
  }

  try {
    const response = await client.getStreamUrls(trackId);
    const directUrl = response?.url || response?.stream_url || response?.streamUrl || response?.data?.url || response?.data?.stream_url || response?.urls?.[0]?.url || response?.data?.urls?.[0]?.url;

    if (directUrl) {
      return {
        url: directUrl,
        format: 'wav',
        quality: quality || 'lossless',
        codec: 'pcm_s16le',
        container: 'wav',
        manifest: 'none',
        encrypted: false,
        sampleRate: 44100,
        bitDepth: 16,
        bitrate: 705600
      };
    }
  } catch (error) {
    // fall through to the local demo stream if the API is unavailable
  }

  if (!fallbackTrack) {
    throw new Error('Track not found');
  }

  return {
    url: `${(env.BASE_URL || env.RENDER_EXTERNAL_URL || `http://localhost:${env.PORT || 8787}`).replace(/\/+$/, '')}/media/demo.wav`,
    format: 'wav',
    quality: quality || 'lossless',
    codec: 'pcm_s16le',
    container: 'wav',
    manifest: 'none',
    encrypted: false,
    sampleRate: 44100,
    bitDepth: 16,
    bitrate: 705600
  };
}

module.exports = {
  isConfigured,
  searchTracks,
  resolveStream,
  createClient
};
