import type { Keypoint, Point } from "../types";
import { clamp } from "./geometry";

export function keypointToScreenPoint(indexTip: Keypoint, video: HTMLVideoElement) {
  const videoWidth = video.videoWidth || video.clientWidth;
  const videoHeight = video.videoHeight || video.clientHeight;

  return {
    x: clamp(indexTip.x / videoWidth, 0, 1) * window.screen.availWidth,
    y: clamp(indexTip.y / videoHeight, 0, 1) * window.screen.availHeight
  };
}

export function smoothPoint(current: Point | null, target: Point, speed: number) {
  const normalizedSpeed = clamp(speed, 0.12, 1);

  if (!current) return target;

  return {
    x: current.x + (target.x - current.x) * normalizedSpeed,
    y: current.y + (target.y - current.y) * normalizedSpeed
  };
}
