import type { Keypoint } from "../types";

export function distance(a: Keypoint, b: Keypoint) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function getPalmScale(keypoints: Keypoint[]) {
  const wrist = keypoints[0];
  const indexMcp = keypoints[5];
  const pinkyMcp = keypoints[17];
  const indexToPinky = distance(indexMcp, pinkyMcp);
  const wristToIndex = distance(wrist, indexMcp);

  return Math.max(indexToPinky, wristToIndex, 1);
}
