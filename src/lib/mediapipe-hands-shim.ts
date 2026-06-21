import "@mediapipe/hands/hands.js";

const mediapipe = globalThis as typeof globalThis & {
  Hands: typeof import("@mediapipe/hands").Hands;
  HAND_CONNECTIONS: typeof import("@mediapipe/hands").HAND_CONNECTIONS;
  VERSION: typeof import("@mediapipe/hands").VERSION;
};

export const Hands = mediapipe.Hands;
export const HAND_CONNECTIONS = mediapipe.HAND_CONNECTIONS;
export const VERSION = mediapipe.VERSION;
