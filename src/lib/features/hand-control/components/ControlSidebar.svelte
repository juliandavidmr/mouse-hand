<script lang="ts">
	import MetricTile from "./MetricTile.svelte";
	import SliderRow from "./SliderRow.svelte";
	import ToggleRow from "./ToggleRow.svelte";
	import type { AppStatus } from "../types";

	type Props = {
		status: AppStatus;
		statusMessage: string;
		handScore: number;
		canPoint: boolean;
		isPinching: boolean;
		pointerEnabled: boolean;
		clickEnabled: boolean;
		pointerSpeed: number;
		detectorReady: boolean;
		isRunning: boolean;
		onStart: () => void;
		onStop: () => void;
	};

	let {
		status,
		statusMessage,
		handScore,
		canPoint,
		isPinching,
		pointerEnabled = $bindable(false),
		clickEnabled = $bindable(true),
		pointerSpeed = $bindable(0.46),
		detectorReady,
		isRunning,
		onStart,
		onStop,
	}: Props = $props();

	const speedLabel = $derived(`${Math.round(pointerSpeed * 100)}%`);
	const confidenceLabel = $derived(`${Math.round(handScore * 100)}%`);
	const gestureLabel = $derived(
		isPinching ? "Click" : canPoint ? "Pointer" : "Idle",
	);
</script>

<aside class="sidebar">
	<section class="status-panel" data-status={status}>
		<span class="status-light"></span>
		<p>{statusMessage}</p>
	</section>

	<section class="metrics">
		<MetricTile label="Confidence" value={confidenceLabel} />
		<MetricTile label="Gesture" value={gestureLabel} />
	</section>

	<section class="panel">
		<div class="toggles">
			<ToggleRow
				label="Pointer"
				description="Fist + index"
				bind:checked={pointerEnabled}
			/>
			<ToggleRow
				label="Click"
				description="Pinch / drag"
				bind:checked={clickEnabled}
			/>
		</div>
		<SliderRow
			label="Speed"
			bind:value={pointerSpeed}
			displayValue={speedLabel}
		/>
	</section>

	<button
		type="button"
		class:secondary={isRunning}
		disabled={!detectorReady && !isRunning}
		onclick={isRunning ? onStop : onStart}
	>
		{isRunning
			? "Stop Camera"
			: detectorReady
				? "Start Camera"
				: "Loading Model"}
	</button>
</aside>

<style>
	.sidebar {
		display: flex;
		flex-direction: column;
		gap: 6px;
		height: 100%;
		min-height: 0;
		min-width: 0;
		overflow: hidden;
		padding: 8px;
		border: 1px solid rgba(0, 0, 0, 0.12);
		border-radius: 12px;
		color: #1d1d1f;
		background: rgba(246, 246, 248, 0.78);
		-webkit-backdrop-filter: blur(28px) saturate(1.35);
		backdrop-filter: blur(28px) saturate(1.35);
		box-shadow:
			0 8px 18px rgba(0, 0, 0, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.78);
	}

	p {
		margin: 0;
	}

	.status-panel,
	.panel {
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.58);
		box-shadow:
			inset 0 0 0 1px rgba(0, 0, 0, 0.06),
			0 1px 0 rgba(255, 255, 255, 0.7);
	}

	.status-panel {
		display: grid;
		grid-template-columns: 8px 1fr;
		gap: 6px;
		align-items: center;
		padding: 6px 7px;
		min-height: 30px;
	}

	.status-panel p {
		color: #3a3a3c;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 10px;
		line-height: 1.1;
	}

	.status-light {
		width: 8px;
		height: 8px;
		margin-top: 0;
		border-radius: 50%;
		background: #8e8e93;
	}

	.status-panel[data-status="tracking"] .status-light,
	.status-panel[data-status="gesture"] .status-light {
		background: #30d158;
	}

	.status-panel[data-status="error"] .status-light {
		background: #ff3b30;
	}

	.metrics {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 6px;
	}

	.panel {
		padding: 5px 7px 0;
	}

	.toggles {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}

	button {
		width: 100%;
		min-height: 28px;
		margin-top: auto;
		border: 0;
		border-radius: 8px;
		color: white;
		background: #007aff;
		font: inherit;
		font-size: 11px;
		font-weight: 800;
		cursor: pointer;
		box-shadow: 0 6px 12px rgba(0, 122, 255, 0.2);
	}

	button.secondary {
		color: #1d1d1f;
		background: rgba(255, 255, 255, 0.76);
		box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
	}

	button:disabled {
		color: #8e8e93;
		background: #e5e5ea;
		cursor: wait;
		box-shadow: none;
	}
</style>
