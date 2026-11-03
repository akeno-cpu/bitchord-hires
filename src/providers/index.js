const amazonProvider = require('./amazon');
const { searchTracks: mockSearchTracks, getTrack: mockGetTrack } = require('../catalogue');

const CREATOR_NAME = 'Akeno';

function resolveProviderMode(env = process.env) {
  const apiUrl = env.AMAZON_API_URL || env.AMAZON_MUSIC_API_URL || env.API_URL;
  const apiToken = env.AMAZON_API_TOKEN || env.AMAZON_ACCESS_TOKEN || env.API_TOKEN;
  const hasLegacyCredentials = Boolean(env.AMAZON_CLIENT_ID && env.AMAZON_CLIENT_SECRET);
  const hasApiCredentials = Boolean(apiUrl && apiToken);
  const enabled = env.AMAZON_MUSIC_ENABLED === 'true';
  const configured = (enabled && (hasLegacyCredentials || hasApiCredentials)) || (!enabled && hasApiCredentials);

  return {
    enabled,
    hasLegacyCredentials,
    hasApiCredentials,
    configured,
    creator: CREATOR_NAME,
    mode: configured ? 'amazon' : 'mock',
    provider: configured ? 'amazon' : 'mock'
  };
}

function createProvider(env = process.env) {
  const state = resolveProviderMode(env);

  if (state.mode === 'amazon') {
    return {
      ...amazonProvider,
      ...state,
      searchTracks: amazonProvider.searchTracks.bind(amazonProvider, env),
      resolveStream: amazonProvider.resolveStream.bind(amazonProvider, env)
    };
  }

  return {
    ...amazonProvider,
    ...state,
    isConfigured: () => false,
    async searchTracks(query) {
      return mockSearchTracks(query);
    },
    async resolveStream(trackId, quality = 'lossless') {
      const track = mockGetTrack(trackId);

      if (!track) {
        throw new Error('Track not found');
      }

      const baseUrl = (env.BASE_URL || env.RENDER_EXTERNAL_URL || `http://localhost:${env.PORT || 8787}`).replace(/\/+$/, '');

      return {
        url: `${baseUrl}/media/demo.wav`,
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
  };
}

module.exports = {
  CREATOR_NAME,
  resolveProviderMode,
  createProvider
};
