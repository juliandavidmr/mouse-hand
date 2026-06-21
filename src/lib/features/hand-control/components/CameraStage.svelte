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
    status
  }: Props = $props();
</script>

<section class="stage" class:active={canPoint} class:pinching={isPinching}>
  <div class="traffic-lights" aria-hidden="true">
    <span class="close"></span>
    <span class="minimize"></span>
    <span class="zoom"></span>
  </div>

  <video bind:this={videoElement} playsinline muted></video>
  <canvas bind:this={canvasElement}></canvas>

  <div class="hud">
    <span class="indicator" class:live={isRunning}></span>
    <span>{isRunning ? "Camera Live" : "Camera Off"}</span>
  </div>

  <div class="gesture-chip" class:ready={canPoint} class:click={isPinching}>
    {#if isPinching}
      Pinch click
    {:else if canPoint}
      Pointer armed
    {:else}
      Waiting gesture
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
    min-height: 580px;
    overflow: hidden;
    border: 1px solid rgba(0, 0, 0, 0.16);
    border-radius: 12px;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.42)),
      #111;
    box-shadow:
      0 18px 48px rgba(0, 0, 0, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.8);
  }

  .stage.active {
    border-color: rgba(48, 209, 88, 0.58);
    box-shadow:
      0 18px 48px rgba(0, 0, 0, 0.2),
      0 0 0 3px rgba(48, 209, 88, 0.16),
      inset 0 1px 0 rgba(255, 255, 255, 0.8);
  }

  .stage.pinching {
    border-color: rgba(10, 132, 255, 0.68);
    box-shadow:
      0 18px 48px rgba(0, 0, 0, 0.2),
      0 0 0 3px rgba(10, 132, 255, 0.18),
      inset 0 1px 0 rgba(255, 255, 255, 0.8);
  }

  .traffic-lights {
    position: absolute;
    z-index: 4;
    top: 14px;
    left: 16px;
    display: flex;
    gap: 8px;
  }

  .traffic-lights span {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.14);
  }

  .close {
    background: #ff5f57;
  }

  .minimize {
    background: #febc2e;
  }

  .zoom {
    background: #28c840;
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
    top: 13px;
    right: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    height: 30px;
    padding: 0 11px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 600;
  }

  .indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #8e8e93;
  }

  .indicator.live {
    background: #30d158;
  }

  .gesture-chip {
    right: 14px;
    bottom: 14px;
    min-width: 128px;
    padding: 9px 12px;
    border-radius: 9px;
    text-align: center;
    font-size: 13px;
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
    gap: 10px;
    padding: 32px;
    text-align: center;
    color: #1d1d1f;
    background:
      radial-gradient(circle at 50% 40%, rgba(255, 255, 255, 0.94), rgba(242, 242, 247, 0.72) 45%, rgba(229, 229, 234, 0.86)),
      #f5f5f7;
  }

  .empty-state.hidden {
    display: none;
  }

  .app-icon {
    justify-self: center;
    width: 72px;
    height: 72px;
    margin: 0;
    display: grid;
    place-items: center;
    border-radius: 18px;
    color: white;
    background: linear-gradient(145deg, #0a84ff, #30d158);
    font-size: 22px;
    font-weight: 800;
    box-shadow: 0 16px 30px rgba(10, 132, 255, 0.26);
  }

  h1,
  p {
    margin: 0;
  }

  h1 {
    font-size: 42px;
    line-height: 1;
    letter-spacing: 0;
  }

  .empty-state p:last-child {
    color: #6e6e73;
    font-size: 15px;
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
      min-height: 52vh;
    }
  }
</style>
