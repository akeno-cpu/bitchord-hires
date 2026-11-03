const test = require('node:test');
const assert = require('node:assert/strict');

const { resolveProviderMode, createProvider } = require('../src/providers');

test('resolveProviderMode prefers Amazon when configured', () => {
  const state = resolveProviderMode({
    AMAZON_MUSIC_ENABLED: 'true',
    AMAZON_CLIENT_ID: 'client-id',
    AMAZON_CLIENT_SECRET: 'client-secret',
    AMAZON_API_URL: 'https://api.example.com',
    AMAZON_API_TOKEN: 'abc123'
  });

  assert.equal(state.mode, 'amazon');
  assert.equal(state.configured, true);
  assert.equal(state.provider, 'amazon');
  assert.equal(state.creator, 'Akeno');
});

test('resolveProviderMode falls back to mock when not configured', () => {
  const state = resolveProviderMode({
    AMAZON_MUSIC_ENABLED: 'false'
  });

  assert.equal(state.mode, 'mock');
  assert.equal(state.configured, false);
  assert.equal(state.provider, 'mock');
  assert.equal(state.creator, 'Akeno');
});

test('createProvider returns a functioning provider object', async () => {
  const provider = createProvider({
    AMAZON_MUSIC_ENABLED: 'true',
    AMAZON_CLIENT_ID: 'client-id',
    AMAZON_CLIENT_SECRET: 'client-secret',
    AMAZON_API_URL: 'https://api.example.com',
    AMAZON_API_TOKEN: 'abc123'
  });

  assert.ok(provider);
  assert.equal(typeof provider.searchTracks, 'function');
  assert.equal(typeof provider.resolveStream, 'function');
});
