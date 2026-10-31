
const tracks = [
  {
    id: "am-demo-001",
    title: "Midnight Dreams",
    artist: "Demo Artist",
    album: "Digital Nights",
    duration: 12,
    format: "wav",
    audioQuality: "LOSSLESS"
  },
  {
    id: "am-demo-002",
    title: "Neon Skies",
    artist: "Demo Artist",
    album: "Digital Nights",
    duration: 12,
    format: "wav",
    audioQuality: "LOSSLESS"
  },
  {
    id: "am-demo-003",
    title: "Electric Horizon",
    artist: "Demo Artist",
    album: "Future Sounds",
    duration: 12,
    format: "wav",
    audioQuality: "LOSSLESS"
  },
  {
    id: "am-demo-004",
    title: "Ocean Lights",
    artist: "Demo Artist",
    album: "Future Sounds",
    duration: 12,
    format: "wav",
    audioQuality: "LOSSLESS"
  }
];

function searchTracks(query) {
  const q = query.trim().toLowerCase();

  if (!q) return tracks;

  return tracks.filter(track =>
    [
      track.title,
      track.artist,
      track.album
    ].join(" ").toLowerCase().includes(q)
  );
}

function getTrack(id) {
  return tracks.find(track => track.id === id);
}

module.exports = {
  tracks,
  searchTracks,
  getTrack
};
