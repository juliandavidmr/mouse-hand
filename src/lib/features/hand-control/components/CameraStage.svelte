<script lang="ts">
	import type { AppStatus } from "../types";

	type Props = {
		videoElement?: HTMLVideoElement;
		canvasElement?: HTMLCanvasElement;
		isRunning: boolean;
		canPoint: boolean;
		isPinching: boolean;
		status: AppStatus;
	};

	let {
		videoElement = $bindable(),
		canvasElement = $bindable(),
		isRunning,
		canPoint,
		isPinching,
		status,
	}: Props = $props();
</script>

<section class="stage" class:active={canPoint} class:pinching={isPinching}>
	<video bind:this={videoElement} playsinline muted></video>
	<canvas bind:this={canvasElement}></canvas>

	<div class="hud">
		<span class="indicator" class:live={isRunning}></span>
		<span>{isRunning ? "Camera Live" : "Camera Off"}</span>
	</div>

	<div class="gesture-chip" class:ready={canPoint} class:click={isPinching}>
		{#if isPinching}
			Pinch
		{:else if canPoint}
			Pointer
		{:else}
			Waiting
		{/if}
	</div>

	<div class="empty-state" class:hidden={isRunning}>
		<p class="app-icon">MH</p>
		<h1>Mouse Hand</h1>
		<p>Native hand control for your pointer.</p>
	</div>

	{#if status === "error"}
		<div class="error-strip">Camera or model unavailable</div>
	{/if}
</section>

<style>
	.stage {
		position: relative;
		min-height: 0;
		height: 100%;
		overflow: hidden;
		border: 1px solid rgba(0, 0, 0, 0.16);
		border-radius: 10px;
		background: linear-gradient(
				180deg,
				rgba(255, 255, 255, 0.72),
				rgba(255, 255, 255, 0.42)
			),
			#111;
		box-shadow:
			0 8px 18px rgba(0, 0, 0, 0.14),
			inset 0 1px 0 rgba(255, 255, 255, 0.8);
	}

	.stage.active {
		border-color: rgba(48, 209, 88, 0.58);
		box-shadow:
			0 8px 18px rgba(0, 0, 0, 0.14),
			0 0 0 3px rgba(48, 209, 88, 0.16),
			inset 0 1px 0 rgba(255, 255, 255, 0.8);
	}

	.stage.pinching {
		border-color: rgba(10, 132, 255, 0.68);
		box-shadow:
			0 8px 18px rgba(0, 0, 0, 0.14),
			0 0 0 3px rgba(10, 132, 255, 0.18),
			inset 0 1px 0 rgba(255, 255, 255, 0.8);
	}

	video,
	canvas {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	video {
		transform: scaleX(-1);
	}

	.hud,
	.gesture-chip,
	.error-strip {
		position: absolute;
		z-index: 3;
		border: 1px solid rgba(255, 255, 255, 0.24);
		background: rgba(245, 245, 247, 0.72);
		color: rgba(29, 29, 31, 0.88);
		-webkit-backdrop-filter: blur(18px);
		backdrop-filter: blur(18px);
		box-shadow: 0 10px 24px rgba(0, 0, 0, 0.14);
	}

	.hud {
		top: 7px;
		right: 8px;
		display: flex;
		align-items: center;
		gap: 8px;
		height: 22px;
		padding: 0 7px;
		border-radius: 999px;
		font-size: 10px;
		font-weight: 600;
	}

	.indicator {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #8e8e93;
	}

	.indicator.live {
		background: #30d158;
	}

	.gesture-chip {
		right: 8px;
		bottom: 8px;
		min-width: 68px;
		padding: 5px 8px;
		border-radius: 8px;
		text-align: center;
		font-size: 10px;
		font-weight: 700;
	}

	.gesture-chip.ready {
		color: #0b4d1d;
		background: rgba(220, 255, 226, 0.82);
	}

	.gesture-chip.click {
		color: #053f75;
		background: rgba(220, 238, 255, 0.88);
	}

	.empty-state {
		position: absolute;
		z-index: 2;
		inset: 0;
		display: grid;
		place-content: center;
		gap: 6px;
		padding: 18px;
		text-align: center;
		color: #1d1d1f;
		background: radial-gradient(
				circle at 50% 40%,
				rgba(255, 255, 255, 0.94),
				rgba(242, 242, 247, 0.72) 45%,
				rgba(229, 229, 234, 0.86)
			),
			#f5f5f7;
	}

	.empty-state.hidden {
		display: none;
	}

	.app-icon {
		justify-self: center;
		width: 36px;
		height: 36px;
		margin: 0;
		display: grid;
		place-items: center;
		border-radius: 12px;
		color: white;
		background: linear-gradient(145deg, #0a84ff, #30d158);
		font-size: 12px;
		font-weight: 800;
		box-shadow: 0 16px 30px rgba(10, 132, 255, 0.26);
	}

	h1,
	p {
		margin: 0;
	}

	h1 {
		font-size: 20px;
		line-height: 1;
		letter-spacing: 0;
	}

	.empty-state p:last-child {
		color: #6e6e73;
		font-size: 11px;
	}

	.error-strip {
		left: 14px;
		right: 14px;
		bottom: 14px;
		padding: 10px 12px;
		border-radius: 9px;
		color: #7a1d1d;
		background: rgba(255, 235, 235, 0.9);
		font-size: 13px;
		font-weight: 700;
	}

	@media (max-width: 860px) {
		.stage {
			min-height: 240px;
		}
	}
</style>
