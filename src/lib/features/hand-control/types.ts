import type * as handPoseDetection from "@tensorflow-models/hand-pose-detection";

export type Keypoint = handPoseDetection.Keypoint;
export type Hand = handPoseDetection.Hand;

export type FingerJoints = readonly [number, number, number, number];

export type GestureState = {
  canPoint: boolean;
  isPinching: boolean;
};

export type Point = {
  x: number;
  y: number;
};

export type AppStatus = "idle" | "ready" | "searching" | "tracking" | "gesture" | "error";
