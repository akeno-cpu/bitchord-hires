
const SAMPLE_RATE = 44100;
const DURATION = 12;

function generateDemoAudio() {
  const samples = SAMPLE_RATE * DURATION;
  const dataSize = samples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  const notes = [261.63, 329.63, 392, 329.63, 440, 392, 329.63, 261.63];
  const noteLength = SAMPLE_RATE * 1.5;

  for (let i = 0; i < samples; i++) {
    const note = notes[Math.floor(i / noteLength) % notes.length];
    const t = i / SAMPLE_RATE;
    const localT = (i % noteLength) / SAMPLE_RATE;

    const attack = Math.min(localT / 0.04, 1);
    const release = Math.min((1.5 - localT) / 0.15, 1);
    const envelope = Math.max(0, Math.min(attack, release));

    const wave = Math.sin(2 * Math.PI * note * t);
    const value = Math.round(
      wave * envelope * 0.35 * 32767
    );

    buffer.writeInt16LE(
      Math.max(-32768, Math.min(32767, value)),
      44 + i * 2
    );
  }

  return buffer;
}

module.exports = { generateDemoAudio };
