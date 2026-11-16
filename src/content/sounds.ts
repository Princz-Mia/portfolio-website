import type { Sounds } from "./types";

// Recordings in public/audio/. Set an entry to null to use the sound the browser
// synthesises instead; the horn also falls back to it in browsers that cannot
// play Ogg Vorbis.
export const sounds: Sounds = {
  hordeHorn: "/audio/horde-horn.ogg",
  lichKingQuote: "/audio/lich-king.wav",
};
