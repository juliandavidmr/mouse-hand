export const MEDIAPIPE_HANDS_SOLUTION_PATH = "https://cdn.jsdelivr.net/npm/@mediapipe/hands";

export const CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    width: { ideal: 960 },
    height: { ideal: 720 },
    facingMode: "user"
  },
  audio: false
};

export const FINGER_JOINTS = {
  index: [5, 6, 7, 8],
  middle: [9, 10, 11, 12],
  ring: [13, 14, 15, 16],
  pinky: [17, 18, 19, 20]
} as const;

export const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17]
] as const;

export const MOVE_INTERVAL_MS = 20;
export const CLICK_COOLDOWN_MS = 420;
export const DRAG_START_DISTANCE_PX = 14;
export const DEFAULT_POINTER_SPEED = 0.46;
export const PINCH_RATIO = 0.18;
export const PINCH_RELEASE_RATIO = 0.28;
