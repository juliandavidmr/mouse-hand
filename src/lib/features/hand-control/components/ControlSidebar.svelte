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
    onStop
  }: Props = $props();

  const speedLabel = $derived(`${Math.round(pointerSpeed * 100)}%`);
  const confidenceLabel = $derived(`${Math.round(handScore * 100)}%`);
  const gestureLabel = $derived(isPinching ? "Click" : canPoint ? "Pointer" : "Idle");
</script>

<aside class="sidebar">
  <header>
    <div class="icon">MH</div>
    <div>
      <p>Mouse Hand</p>
      <h2>Pointer Control</h2>
    </div>
  </header>

  <section class="status-panel" data-status={status}>
    <span class="status-light"></span>
    <p>{statusMessage}</p>
  </section>

  <section class="metrics">
    <MetricTile label="Confidence" value={confidenceLabel} />
    <MetricTile label="Gesture" value={gestureLabel} />
  </section>

  <section class="panel">
    <h3>Controls</h3>
    <ToggleRow
      label="Pointer"
      description="Closed fist with index raised"
      bind:checked={pointerEnabled}
    />
    <ToggleRow
      label="Click"
      description="Pinch index and thumb"
      bind:checked={clickEnabled}
    />
    <SliderRow label="Mouse Speed" bind:value={pointerSpeed} displayValue={speedLabel} />
  </section>

  <button type="button" class:secondary={isRunning} disabled={!detectorReady && !isRunning} onclick={isRunning ? onStop : onStart}>
    {isRunning ? "Stop Camera" : detectorReady ? "Start Camera" : "Loading Model"}
  </button>
</aside>

<style>
  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 16px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 12px;
    color: #1d1d1f;
    background: rgba(246, 246, 248, 0.78);
    -webkit-backdrop-filter: blur(28px) saturate(1.35);
    backdrop-filter: blur(28px) saturate(1.35);
    box-shadow:
      0 18px 48px rgba(0, 0, 0, 0.16),
      inset 0 1px 0 rgba(255, 255, 255, 0.78);
  }

  header {
    display: grid;
    grid-template-columns: 42px 1fr;
    gap: 12px;
    align-items: center;
    padding: 2px 2px 8px;
  }

  .icon {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    color: white;
    background: linear-gradient(145deg, #0a84ff, #30d158);
    font-size: 13px;
    font-weight: 800;
    box-shadow: 0 10px 18px rgba(10, 132, 255, 0.22);
  }

  p,
  h2,
  h3 {
    margin: 0;
  }

  header p {
    color: #6e6e73;
    font-size: 12px;
    font-weight: 700;
  }

  h2 {
    margin-top: 2px;
    font-size: 20px;
    line-height: 1.1;
    letter-spacing: 0;
  }

  .status-panel,
  .panel {
    border-radius: 11px;
    background: rgba(255, 255, 255, 0.58);
    box-shadow:
      inset 0 0 0 1px rgba(0, 0, 0, 0.06),
      0 1px 0 rgba(255, 255, 255, 0.7);
  }

  .status-panel {
    display: grid;
    grid-template-columns: 10px 1fr;
    gap: 10px;
    align-items: start;
    padding: 12px;
    min-height: 58px;
  }

  .status-panel p {
    color: #3a3a3c;
    font-size: 13px;
    line-height: 1.35;
  }

  .status-light {
    width: 10px;
    height: 10px;
    margin-top: 4px;
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
    gap: 10px;
  }

  .panel {
    padding: 13px 14px 4px;
  }

  h3 {
    padding-bottom: 2px;
    color: #6e6e73;
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
  }

  button {
    width: 100%;
    min-height: 42px;
    margin-top: auto;
    border: 0;
    border-radius: 9px;
    color: white;
    background: #007aff;
    font: inherit;
    font-size: 14px;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 8px 18px rgba(0, 122, 255, 0.24);
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
