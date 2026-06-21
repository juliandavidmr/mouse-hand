import { HAND_CONNECTIONS } from "../constants";
import type { Hand, Keypoint } from "../types";

export function drawHands(canvas: HTMLCanvasElement, video: HTMLVideoElement, hands: Hand[]) {
  const context = canvas.getContext("2d");
  if (!context) return;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.clearRect(0, 0, canvas.width, canvas.height);

  for (const hand of hands) {
    drawConnections(context, hand.keypoints);
    drawKeypoints(context, hand.keypoints);
  }
}

export function clearCanvas(canvas?: HTMLCanvasElement) {
  if (!canvas) return;
  const context = canvas?.getContext("2d");
  context?.clearRect(0, 0, canvas.width, canvas.height);
}

function drawConnections(context: CanvasRenderingContext2D, keypoints: Keypoint[]) {
  context.lineWidth = 3;
  context.strokeStyle = "rgba(255, 255, 255, 0.74)";

  for (const [start, end] of HAND_CONNECTIONS) {
    context.beginPath();
    context.moveTo(keypoints[start].x, keypoints[start].y);
    context.lineTo(keypoints[end].x, keypoints[end].y);
    context.stroke();
  }
}

function drawKeypoints(context: CanvasRenderingContext2D, keypoints: Keypoint[]) {
  for (const keypoint of keypoints) {
    const isIndexTip = keypoint.name === "index_finger_tip";
    const isThumbTip = keypoint.name === "thumb_tip";

    context.beginPath();
    context.arc(keypoint.x, keypoint.y, isIndexTip || isThumbTip ? 7 : 4, 0, Math.PI * 2);
    context.fillStyle = isIndexTip ? "#ff9f0a" : isThumbTip ? "#0a84ff" : "#30d158";
    context.fill();
  }
}
