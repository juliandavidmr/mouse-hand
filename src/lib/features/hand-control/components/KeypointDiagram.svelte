<script lang="ts">
	import { onMount } from "svelte";
	import { HAND_CONNECTIONS } from "../constants";
	import type { Keypoint } from "../types";

	type Props = {
		keypoints: Keypoint[] | null;
		isPinching: boolean;
		isDragging: boolean;
		canPoint: boolean;
	};

	let { keypoints, isPinching, isDragging, canPoint }: Props = $props();
	let canvas: HTMLCanvasElement;

	onMount(() => {
		drawDiagram();
	});

	$effect(() => {
		keypoints;
		isPinching;
		isDragging;
		canPoint;
		drawDiagram();
	});

	function drawDiagram() {
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();
		const scale = window.devicePixelRatio || 1;
		canvas.width = Math.max(1, Math.round(rect.width * scale));
		canvas.height = Math.max(1, Math.round(rect.height * scale));

		const context = canvas.getContext("2d");
		if (!context) return;

		context.scale(scale, scale);
		context.clearRect(0, 0, rect.width, rect.height);
		drawBackground(context, rect.width, rect.height);

		if (!keypoints?.length) {
			drawEmptyState(context, rect.width, rect.height);
			return;
		}

		const normalized = normalizeKeypoints(keypoints, rect.width, rect.height);
		drawBones(context, normalized);
		drawJoints(context, normalized);
		drawPinchGuide(context, normalized);
	}

	function drawBackground(
		context: CanvasRenderingContext2D,
		width: number,
		height: number,
	) {
		const gradient = context.createLinearGradient(0, 0, width, height);
		gradient.addColorStop(0, "#f7f9fc");
		gradient.addColorStop(1, "#ecf3f0");
		context.fillStyle = gradient;
		context.fillRect(0, 0, width, height);

		context.strokeStyle = "rgba(60, 60, 67, 0.08)";
		context.lineWidth = 1;
		for (let x = 48; x < width; x += 48) {
			context.beginPath();
			context.moveTo(x, 0);
			context.lineTo(x, height);
			context.stroke();
		}
		for (let y = 48; y < height; y += 48) {
			context.beginPath();
			context.moveTo(0, y);
			context.lineTo(width, y);
			context.stroke();
		}
	}

	function drawEmptyState(
		context: CanvasRenderingContext2D,
		width: number,
		height: number,
	) {
		context.fillStyle = "#6e6e73";
		context.font = "600 13px -apple-system, BlinkMacSystemFont, sans-serif";
		context.textAlign = "center";
		context.fillText("Waiting for hand keypoints", width / 2, height / 2);
	}

	function normalizeKeypoints(
		points: Keypoint[],
		width: number,
		height: number,
	) {
		const minX = Math.min(...points.map((point) => point.x));
		const maxX = Math.max(...points.map((point) => point.x));
		const minY = Math.min(...points.map((point) => point.y));
		const maxY = Math.max(...points.map((point) => point.y));
		const handWidth = Math.max(maxX - minX, 1);
		const handHeight = Math.max(maxY - minY, 1);
		const fit = Math.min(
			(width * 0.72) / handWidth,
			(height * 0.72) / handHeight,
		);
		const offsetX = (width - handWidth * fit) / 2 - minX * fit;
		const offsetY = (height - handHeight * fit) / 2 - minY * fit;

		return points.map((point) => ({
			...point,
			x: point.x * fit + offsetX,
			y: point.y * fit + offsetY,
		}));
	}

	function drawBones(context: CanvasRenderingContext2D, points: Keypoint[]) {
		context.lineCap = "round";
		context.lineJoin = "round";
		context.lineWidth = isDragging ? 6 : isPinching ? 5 : 4;
		context.strokeStyle = isDragging
			? "#ff9f0a"
			: isPinching
				? "#0a84ff"
				: "#8e8e93";

		for (const [start, end] of HAND_CONNECTIONS) {
			context.beginPath();
			context.moveTo(points[start].x, points[start].y);
			context.lineTo(points[end].x, points[end].y);
			context.stroke();
		}
	}

	function drawJoints(context: CanvasRenderingContext2D, points: Keypoint[]) {
		for (let index = 0; index < points.length; index += 1) {
			const point = points[index];
			const isTip = [4, 8, 12, 16, 20].includes(index);
			const isActive = index === 4 || index === 8;

			context.beginPath();
			context.arc(
				point.x,
				point.y,
				isActive ? 7 : isTip ? 5 : 4,
				0,
				Math.PI * 2,
			);
			context.fillStyle = isActive
				? isPinching
					? "#0a84ff"
					: "#1d1d1f"
				: canPoint
					? "#30d158"
					: "#ffffff";
			context.fill();
			context.lineWidth = 2;
			context.strokeStyle = "rgba(29, 29, 31, 0.18)";
			context.stroke();
		}
	}

	function drawPinchGuide(
		context: CanvasRenderingContext2D,
		points: Keypoint[],
	) {
		const thumb = points[4];
		const index = points[8];
		const distance = Math.hypot(thumb.x - index.x, thumb.y - index.y);

		context.beginPath();
		context.moveTo(thumb.x, thumb.y);
		context.lineTo(index.x, index.y);
		context.setLineDash(isPinching ? [] : [7, 7]);
		context.lineWidth = 3;
		context.strokeStyle = isDragging
			? "#ff9f0a"
			: isPinching
				? "#0a84ff"
				: "rgba(60, 60, 67, 0.42)";
		context.stroke();
		context.setLineDash([]);

		context.fillStyle = "#1d1d1f";
		context.font = "700 11px -apple-system, BlinkMacSystemFont, sans-serif";
		context.textAlign = "left";
		context.fillText(
			`${Math.round(distance)} px`,
			Math.min(thumb.x, index.x) + 12,
			Math.min(thumb.y, index.y) - 10,
		);
	}
</script>

<section
	class="diagram"
	class:pinching={isPinching}
	class:dragging={isDragging}
>
	<header>
		<div>
			<p>Keypoint Diagram</p>
			<h2>Virtual Hand</h2>
		</div>
		<span
			>{isDragging
				? "Dragging"
				: isPinching
					? "Pinch"
					: canPoint
						? "Pointer"
						: "Idle"}</span
		>
	</header>

	<canvas bind:this={canvas}></canvas>
</section>

<style>
	.diagram {
		display: grid;
		grid-template-rows: auto minmax(0, 1fr);
		height: 100%;
		min-height: 0;
		min-width: 0;
		overflow: hidden;
		border: 1px solid rgba(0, 0, 0, 0.12);
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.72);
		box-shadow:
			0 12px 28px rgba(0, 0, 0, 0.12),
			inset 0 1px 0 rgba(255, 255, 255, 0.9);
	}

	.diagram.pinching {
		border-color: rgba(10, 132, 255, 0.42);
	}

	.diagram.dragging {
		border-color: rgba(255, 159, 10, 0.52);
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		min-width: 0;
		min-height: 44px;
		padding: 8px 12px;
		border-bottom: 1px solid rgba(0, 0, 0, 0.08);
		background: rgba(246, 246, 248, 0.78);
		-webkit-backdrop-filter: blur(18px);
		backdrop-filter: blur(18px);
	}

	p,
	h2 {
		margin: 0;
	}

	p {
		color: #6e6e73;
		font-size: 10px;
		font-weight: 800;
	}

	h2 {
		margin-top: 2px;
		color: #1d1d1f;
		font-size: 16px;
		line-height: 1.1;
		white-space: nowrap;
	}

	span {
		min-width: 70px;
		padding: 5px 8px;
		border-radius: 999px;
		color: #1d1d1f;
		background: rgba(255, 255, 255, 0.76);
		box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
		text-align: center;
		font-size: 11px;
		font-weight: 800;
	}

	canvas {
		width: 100%;
		height: 100%;
		min-height: 0;
	}

	@media (max-width: 860px) {
		.diagram {
			height: 280px;
		}
	}
</style>
