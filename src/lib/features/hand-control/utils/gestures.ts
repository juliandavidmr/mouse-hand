import { FINGER_JOINTS, PINCH_RATIO, PINCH_RELEASE_RATIO } from "../constants";
import type { FingerJoints, GestureState, Keypoint } from "../types";
import { distance, getPalmScale } from "./geometry";

export function getGestureState(keypoints: Keypoint[], wasPinching = false): GestureState {
  const indexExtended = isFingerExtended(keypoints, FINGER_JOINTS.index);
  const middleClosed = isFingerClosed(keypoints, FINGER_JOINTS.middle);
  const ringClosed = isFingerClosed(keypoints, FINGER_JOINTS.ring);
  const pinkyClosed = isFingerClosed(keypoints, FINGER_JOINTS.pinky);
  const isPinching = isPinchGesture(keypoints, wasPinching);

  return {
    canPoint: indexExtended && middleClosed && ringClosed && pinkyClosed,
    isPinching
  };
}

function isFingerExtended(keypoints: Keypoint[], joints: FingerJoints) {
  const [mcpIndex, pipIndex, dipIndex, tipIndex] = joints;
  const wrist = keypoints[0];
  const mcp = keypoints[mcpIndex];
  const pip = keypoints[pipIndex];
  const dip = keypoints[dipIndex];
  const tip = keypoints[tipIndex];

  return (
    distance(tip, wrist) > distance(pip, wrist) * 1.16 &&
    distance(tip, mcp) > distance(dip, mcp) * 1.08 &&
    distance(tip, pip) > distance(dip, pip) * 1.05
  );
}

function isFingerClosed(keypoints: Keypoint[], joints: FingerJoints) {
  const [mcpIndex, pipIndex, dipIndex, tipIndex] = joints;
  const wrist = keypoints[0];
  const mcp = keypoints[mcpIndex];
  const pip = keypoints[pipIndex];
  const dip = keypoints[dipIndex];
  const tip = keypoints[tipIndex];

  return (
    distance(tip, wrist) < distance(pip, wrist) * 1.08 ||
    distance(tip, mcp) < distance(dip, mcp) * 1.18 ||
    distance(tip, pip) < distance(dip, pip) * 1.2
  );
}

function isPinchGesture(keypoints: Keypoint[], wasPinching: boolean) {
  const thumbTip = keypoints[4];
  const indexTip = keypoints[8];
  const threshold = getPalmScale(keypoints) * (wasPinching ? PINCH_RELEASE_RATIO : PINCH_RATIO);

  return distance(thumbTip, indexTip) < threshold;
}
