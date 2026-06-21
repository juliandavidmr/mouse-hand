<script lang="ts">
	import { invoke } from "@tauri-apps/api/core";
	import { onDestroy, onMount } from "svelte";
	import * as handPoseDetection from "@tensorflow-models/hand-pose-detection";
	import "@tensorflow/tfjs-backend-webgl";
	import * as tf from "@tensorflow/tfjs-core";
	import CameraStage from "$lib/features/hand-control/components/CameraStage.svelte";
	import ControlSidebar from "$lib/features/hand-control/components/ControlSidebar.svelte";
	import KeypointDiagram from "$lib/features/hand-control/components/KeypointDiagram.svelte";
	import {
		CAMERA_CONSTRAINTS,
		CLICK_COOLDOWN_MS,
		DRAG_START_DISTANCE_PX,
		DEFAULT_POINTER_SPEED,
		MEDIAPIPE_HANDS_SOLUTION_PATH,
		MOVE_INTERVAL_MS,
	} from "$lib/features/hand-control/constants";
	import type { AppStatus, Point } from "$lib/features/hand-control/types";
	import {
		clearCanvas,
		drawHands,
	} from "$lib/features/hand-control/utils/drawing";
	import { getGestureState } from "$lib/features/hand-control/utils/gestures";
	import {
		keypointToScreenPoint,
		smoothPoint,
	} from "$lib/features/hand-control/utils/pointer";

	let video = $state<HTMLVideoElement | undefined>();
	let canvas = $state<HTMLCanvasElement | undefined>();
	let stream: MediaStream | null = null;
	let detector = $state<handPoseDetection.HandDetector | null>(null);
	let animationFrame = 0;
	let isRunning = $state(false);
	let pointerEnabled = $state(false);
	let clickEnabled = $state(true);
	let canPoint = $state(false);
	let isPinching = $state(false);
	let isDragging = $state(false);
	let status = $state<AppStatus>("idle");
	let statusMessage = $state("Initializing hand model...");
	let handScore = $state(0);
	let pointerSpeed = $state(DEFAULT_POINTER_SPEED);
	let currentKeypoints = $state<handPoseDetection.Keypoint[] | null>(null);
	let lastMoveAt = 0;
	let lastClickAt = 0;
	let mouseButtonIsDown = false;
	let pinchStartPoint: Point | null = null;
	let smoothedPointer: Point | null = null;

	onMount(async () => {
		await setupDetector();
	});

	onDestroy(() => {
		stopCamera();
		detector?.dispose();
	});

	async function setupDetector() {
		try {
			await tf.setBackend("webgl");
			await tf.ready();

			detector = await handPoseDetection.createDetector(
				handPoseDetection.SupportedModels.MediaPipeHands,
				{
					runtime: "mediapipe",
					solutionPath: MEDIAPIPE_HANDS_SOLUTION_PATH,
					modelType: "full",
					maxHands: 1,
				},
			);

			status = "ready";
			statusMessage = "Model ready. Start the camera to begin.";
		} catch (error) {
			status = "error";
			statusMessage = `Model failed: ${getErrorMessage(error)}`;
		}
	}

	async function startCamera() {
		if (!detector) {
			statusMessage = "The hand model is still loading.";
			return;
		}

		try {
			stream = await navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS);
			if (!video) return;

			video.srcObject = stream;
			await video.play();

			isRunning = true;
			status = "searching";
			statusMessage = "Looking for a hand...";
			detectFrame();
		} catch (error) {
			status = "error";
			statusMessage = `Camera failed: ${getErrorMessage(error)}`;
		}
	}

	function stopCamera() {
		isRunning = false;
		canPoint = false;
		isPinching = false;
		isDragging = false;
		handScore = 0;
		currentKeypoints = null;
		smoothedPointer = null;
		releaseMouseButton();
		cancelAnimationFrame(animationFrame);
		stream?.getTracks().forEach((track) => track.stop());
		stream = null;
		if (video) {
			video.srcObject = null;
		}
		clearCanvas(canvas);
		if (detector) {
			status = "ready";
			statusMessage = "Model ready. Start the camera to begin.";
		}
	}

	async function detectFrame() {
		if (
			!detector ||
			!video ||
			!canvas ||
			video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA
		) {
			animationFrame = requestAnimationFrame(detectFrame);
			return;
		}

		const hands = await detector.estimateHands(video, { flipHorizontal: true });
		const hand = hands[0];
		drawHands(canvas, video, hands);

		if (!hand) {
			canPoint = false;
			isPinching = false;
			isDragging = false;
			handScore = 0;
			currentKeypoints = null;
			smoothedPointer = null;
			await releaseMouseButton();
			status = "searching";
			statusMessage = "No hand detected.";
			animationFrame = requestAnimationFrame(detectFrame);
			return;
		}

		handScore = hand.score ?? 0;
		currentKeypoints = hand.keypoints;
		const gesture = getGestureState(hand.keypoints, isPinching);
		canPoint = gesture.canPoint;
		isPinching = gesture.isPinching;

		const shouldMovePointer = pointerEnabled && (canPoint || isPinching);
		const pointerPoint = shouldMovePointer
			? await movePointer(hand.keypoints[8])
			: null;

		if (!shouldMovePointer) {
			smoothedPointer = null;
			await releaseMouseButton();
		}

		if (clickEnabled && pointerEnabled) {
			await handlePinch(pointerPoint);
		} else {
			await releaseMouseButton();
		}

		updateStatus();
		animationFrame = requestAnimationFrame(detectFrame);
	}

	async function movePointer(indexTip: handPoseDetection.Keypoint) {
		if (!video) return null;

		const now = performance.now();
		if (now - lastMoveAt < MOVE_INTERVAL_MS) return smoothedPointer;
		lastMoveAt = now;

		const target = keypointToScreenPoint(indexTip, video);
		smoothedPointer = smoothPoint(smoothedPointer, target, pointerSpeed);

		await invoke("move_cursor", {
			x: Math.round(smoothedPointer.x),
			y: Math.round(smoothedPointer.y),
		});

		return smoothedPointer;
	}

	async function handlePinch(pointerPoint: Point | null) {
		if (!isPinching) {
			await releaseMouseButton();
			return;
		}

		const now = performance.now();
		if (now - lastClickAt < CLICK_COOLDOWN_MS) return;

		if (!mouseButtonIsDown) {
			mouseButtonIsDown = true;
			isDragging = false;
			pinchStartPoint = pointerPoint;
			await invoke("mouse_down");
			return;
		}

		if (pointerPoint && pinchStartPoint) {
			const moved = Math.hypot(
				pointerPoint.x - pinchStartPoint.x,
				pointerPoint.y - pinchStartPoint.y,
			);
			isDragging = moved >= DRAG_START_DISTANCE_PX;
		}
	}

	async function releaseMouseButton() {
		if (!mouseButtonIsDown) return;

		mouseButtonIsDown = false;
		pinchStartPoint = null;
		lastClickAt = performance.now();
		await invoke("mouse_up");
	}

	function updateStatus() {
		if (isDragging && clickEnabled && pointerEnabled) {
			status = "gesture";
			statusMessage = "Drag active. Release the pinch to drop.";
			return;
		}

		if (isPinching && clickEnabled && pointerEnabled) {
			status = "gesture";
			statusMessage = "Pinch held. Move to drag or release to click.";
			return;
		}

		if (canPoint && pointerEnabled) {
			status = "tracking";
			statusMessage = "Pointer active. Move your raised index finger.";
			return;
		}

		if (canPoint) {
			status = "gesture";
			statusMessage =
				"Pointer gesture detected. Enable Pointer to control the cursor.";
			return;
		}

		status = "searching";
		statusMessage = "Close your fist and raise only the index finger.";
	}

	function getErrorMessage(error: unknown) {
		return error instanceof Error ? error.message : String(error);
	}
</script>

<svelte:head>
	<title>Mouse Hand</title>
</svelte:head>

<main class="app-shell">
	<section class="window">
		<KeypointDiagram
			keypoints={currentKeypoints}
			{isPinching}
			{isDragging}
			{canPoint}
		/>

		<div class="utility-column">
			<ControlSidebar
				{status}
				{statusMessage}
				{handScore}
				{canPoint}
				{isPinching}
				bind:pointerEnabled
				bind:clickEnabled
				bind:pointerSpeed
				detectorReady={Boolean(detector)}
				{isRunning}
				onStart={startCamera}
				onStop={stopCamera}
			/>

			<CameraStage
				bind:videoElement={video}
				bind:canvasElement={canvas}
				{isRunning}
				{canPoint}
				{isPinching}
				{status}
			/>
		</div>
	</section>
</main>

<style>
	:global(*) {
		box-sizing: border-box;
	}

	:global(body) {
		margin: 0;
		min-width: 320px;
		min-height: 100vh;
		overflow: hidden;
		display: grid;
		place-items: center;
		font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text",
			"SF Pro Display", "Segoe UI", sans-serif;
		color: #1d1d1f;
		background: linear-gradient(135deg, #e9edf5 0%, #f8f8fb 48%, #e9f4ef 100%);
		font-synthesis: none;
		text-rendering: optimizeLegibility;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}

	.app-shell {
		width: 100%;
		height: 100vh;
		padding: 6px;
		overflow: hidden;
	}

	.window {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 236px;
		gap: 6px;
		width: calc(100vw - 12px);
		height: calc(100vh - 12px);
		margin: 0;
		align-items: stretch;
		min-height: 0;
		min-width: 0;
		overflow: hidden;
	}

	.utility-column {
		display: grid;
		grid-template-rows: minmax(0, 1fr) 122px;
		gap: 6px;
		min-height: 0;
		min-width: 0;
		overflow: hidden;
	}

	@media (max-width: 860px) {
		:global(body) {
			overflow: auto;
		}

		.app-shell {
			height: auto;
			padding: 6px;
		}

		.window {
			grid-template-columns: 1fr;
			width: calc(100vw - 12px);
			height: auto;
			min-height: auto;
		}

		.utility-column {
			grid-template-rows: auto 122px;
		}
	}
</style>
