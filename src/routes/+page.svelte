<script lang="ts">
  import { invoke } from "@tauri-apps/api/core";
  import { onDestroy, onMount } from "svelte";
  import * as handPoseDetection from "@tensorflow-models/hand-pose-detection";
  import "@tensorflow/tfjs-backend-webgl";
  import * as tf from "@tensorflow/tfjs-core";

  type Keypoint = handPoseDetection.Keypoint;
  type Hand = handPoseDetection.Hand;

  const fingerJoints = {
    index: [5, 6, 7, 8],
    middle: [9, 10, 11, 12],
    ring: [13, 14, 15, 16],
    pinky: [17, 18, 19, 20]
  } as const;

  let video: HTMLVideoElement;
  let canvas: HTMLCanvasElement;
  let stream: MediaStream | null = null;
  let detector = $state<handPoseDetection.HandDetector | null>(null);
  let animationFrame = 0;
  let isRunning = $state(false);
  let pointerEnabled = $state(false);
  let isGestureActive = $state(false);
  let status = $state("Inicializando modelo...");
  let handScore = $state(0);
  let lastMoveAt = 0;
  let smoothedPointer: { x: number; y: number } | null = null;

  const moveIntervalMs = 28;
  const smoothing = 0.36;

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
          solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/hands",
          modelType: "full",
          maxHands: 1
        }
      );

      status = "Modelo listo. Activa la camara para empezar.";
    } catch (error) {
      status = `No se pudo cargar el modelo: ${getErrorMessage(error)}`;
    }
  }

  async function startCamera() {
    if (!detector) {
      status = "El modelo aun no esta listo.";
      return;
    }

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 960 },
          height: { ideal: 720 },
          facingMode: "user"
        },
        audio: false
      });

      video.srcObject = stream;
      await video.play();

      isRunning = true;
      status = "Buscando mano...";
      detectFrame();
    } catch (error) {
      status = `No se pudo abrir la camara: ${getErrorMessage(error)}`;
    }
  }

  function stopCamera() {
    isRunning = false;
    isGestureActive = false;
    handScore = 0;
    smoothedPointer = null;
    cancelAnimationFrame(animationFrame);
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    if (video) {
      video.srcObject = null;
    }
    clearCanvas();
  }

  async function detectFrame() {
    if (!detector || !video || video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) {
      animationFrame = requestAnimationFrame(detectFrame);
      return;
    }

    const hands = await detector.estimateHands(video, { flipHorizontal: true });
    const hand = hands[0];
    drawHands(hands);

    if (!hand) {
      isGestureActive = false;
      handScore = 0;
      smoothedPointer = null;
      status = "No hay mano detectada.";
    } else {
      handScore = hand.score ?? 0;
      const gestureActive = isPointerGesture(hand.keypoints);
      isGestureActive = gestureActive;
      status = gestureActive
        ? pointerEnabled
          ? "Gesto activo: moviendo cursor."
          : "Gesto activo. Activa control para mover el cursor."
        : "Cierra el puno y deja solo el indice levantado.";

      if (gestureActive && pointerEnabled) {
        await movePointer(hand.keypoints[8]);
      } else {
        smoothedPointer = null;
      }
    }

    animationFrame = requestAnimationFrame(detectFrame);
  }

  function isPointerGesture(keypoints: Keypoint[]) {
    const indexExtended = isFingerExtended(keypoints, fingerJoints.index);
    const middleClosed = isFingerClosed(keypoints, fingerJoints.middle);
    const ringClosed = isFingerClosed(keypoints, fingerJoints.ring);
    const pinkyClosed = isFingerClosed(keypoints, fingerJoints.pinky);

    return indexExtended && middleClosed && ringClosed && pinkyClosed;
  }

  function isFingerExtended(keypoints: Keypoint[], joints: readonly [number, number, number, number]) {
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

  function isFingerClosed(keypoints: Keypoint[], joints: readonly [number, number, number, number]) {
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

  function distance(a: Keypoint, b: Keypoint) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  async function movePointer(indexTip: Keypoint) {
    const now = performance.now();
    if (now - lastMoveAt < moveIntervalMs) return;
    lastMoveAt = now;

    const videoWidth = video.videoWidth || video.clientWidth;
    const videoHeight = video.videoHeight || video.clientHeight;
    const target = {
      x: clamp(indexTip.x / videoWidth, 0, 1) * window.screen.availWidth,
      y: clamp(indexTip.y / videoHeight, 0, 1) * window.screen.availHeight
    };

    smoothedPointer = smoothedPointer
      ? {
          x: smoothedPointer.x + (target.x - smoothedPointer.x) * smoothing,
          y: smoothedPointer.y + (target.y - smoothedPointer.y) * smoothing
        }
      : target;

    await invoke("move_cursor", {
      x: Math.round(smoothedPointer.x),
      y: Math.round(smoothedPointer.y)
    });
  }

  function drawHands(hands: Hand[]) {
    if (!canvas || !video) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.clearRect(0, 0, canvas.width, canvas.height);

    for (const hand of hands) {
      drawConnections(context, hand.keypoints);
      for (const keypoint of hand.keypoints) {
        context.beginPath();
        context.arc(keypoint.x, keypoint.y, keypoint.name === "index_finger_tip" ? 7 : 4, 0, Math.PI * 2);
        context.fillStyle = keypoint.name === "index_finger_tip" ? "#ffca3a" : "#6be675";
        context.fill();
      }
    }
  }

  function drawConnections(context: CanvasRenderingContext2D, keypoints: Keypoint[]) {
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [5, 6], [6, 7], [7, 8],
      [0, 9], [9, 10], [10, 11], [11, 12],
      [0, 13], [13, 14], [14, 15], [15, 16],
      [0, 17], [17, 18], [18, 19], [19, 20],
      [5, 9], [9, 13], [13, 17]
    ];

    context.lineWidth = 3;
    context.strokeStyle = "rgba(255, 255, 255, 0.74)";
    for (const [start, end] of connections) {
      context.beginPath();
      context.moveTo(keypoints[start].x, keypoints[start].y);
      context.lineTo(keypoints[end].x, keypoints[end].y);
      context.stroke();
    }
  }

  function clearCanvas() {
    const context = canvas?.getContext("2d");
    context?.clearRect(0, 0, canvas.width, canvas.height);
  }

  function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
  }

  function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }
</script>

<svelte:head>
  <title>Mouse Hand</title>
</svelte:head>

<main class="app-shell">
  <section class="workspace">
    <div class="camera-frame" class:active={isGestureActive}>
      <video bind:this={video} playsinline muted></video>
      <canvas bind:this={canvas}></canvas>
      <div class="empty-state" class:hidden={isRunning}>
        <h1>Mouse Hand</h1>
        <p>Control del cursor con MediaPipe Hands y el dedo indice.</p>
      </div>
    </div>

    <aside class="control-panel">
      <div>
        <p class="eyebrow">Hand pose detection</p>
        <h2>Cursor con indice</h2>
      </div>

      <div class="status-card" class:ready={isGestureActive}>
        <span class="status-dot"></span>
        <p>{status}</p>
      </div>

      <div class="metrics">
        <div>
          <span>Confianza</span>
          <strong>{Math.round(handScore * 100)}%</strong>
        </div>
        <div>
          <span>Gesto</span>
          <strong>{isGestureActive ? "Activo" : "Inactivo"}</strong>
        </div>
      </div>

      <label class="toggle">
        <input type="checkbox" bind:checked={pointerEnabled} />
        <span></span>
        Controlar cursor
      </label>

      <div class="actions">
        {#if isRunning}
          <button type="button" onclick={stopCamera}>Detener camara</button>
        {:else}
          <button type="button" onclick={startCamera} disabled={!detector}>Activar camara</button>
        {/if}
      </div>
    </aside>
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
    font-family:
      Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    color: #eaf0f1;
    background: #101313;
  }

  .app-shell {
    min-height: 100vh;
    padding: 24px;
    background:
      linear-gradient(135deg, rgba(31, 87, 91, 0.18), transparent 42%),
      linear-gradient(315deg, rgba(116, 67, 40, 0.2), transparent 40%),
      #101313;
  }

  .workspace {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 320px;
    gap: 20px;
    width: min(1180px, 100%);
    min-height: calc(100vh - 48px);
    margin: 0 auto;
    align-items: stretch;
  }

  .camera-frame {
    position: relative;
    min-height: 520px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    background: #171b1b;
  }

  .camera-frame.active {
    border-color: rgba(107, 230, 117, 0.82);
    box-shadow: 0 0 0 1px rgba(107, 230, 117, 0.2);
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

  .empty-state {
    position: absolute;
    inset: 0;
    display: grid;
    place-content: center;
    gap: 10px;
    padding: 28px;
    text-align: center;
    background:
      linear-gradient(135deg, rgba(31, 87, 91, 0.35), transparent),
      #171b1b;
  }

  .empty-state.hidden {
    display: none;
  }

  h1,
  h2,
  p {
    margin: 0;
  }

  h1 {
    font-size: 48px;
    line-height: 1;
  }

  h2 {
    font-size: 28px;
    line-height: 1.1;
  }

  .control-panel {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 22px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    background: rgba(18, 22, 22, 0.92);
  }

  .eyebrow {
    margin-bottom: 8px;
    color: #9ccbcc;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0;
    text-transform: uppercase;
  }

  .status-card,
  .metrics,
  .toggle {
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.045);
  }

  .status-card {
    display: grid;
    grid-template-columns: 12px 1fr;
    gap: 12px;
    align-items: start;
    padding: 14px;
    color: #c6d2d3;
  }

  .status-card.ready {
    color: #effff0;
    background: rgba(107, 230, 117, 0.11);
  }

  .status-dot {
    width: 12px;
    height: 12px;
    margin-top: 6px;
    border-radius: 50%;
    background: #7c898a;
  }

  .status-card.ready .status-dot {
    background: #6be675;
  }

  .metrics {
    display: grid;
    grid-template-columns: 1fr 1fr;
    overflow: hidden;
  }

  .metrics div {
    display: flex;
    min-height: 74px;
    flex-direction: column;
    justify-content: center;
    gap: 6px;
    padding: 14px;
  }

  .metrics div + div {
    border-left: 1px solid rgba(255, 255, 255, 0.1);
  }

  .metrics span {
    color: #9aa7a8;
    font-size: 13px;
  }

  .metrics strong {
    font-size: 22px;
  }

  .toggle {
    display: grid;
    grid-template-columns: 46px 1fr;
    gap: 12px;
    align-items: center;
    padding: 13px 14px;
    color: #dde7e7;
    font-weight: 700;
    cursor: pointer;
  }

  .toggle input {
    position: absolute;
    opacity: 0;
  }

  .toggle span {
    position: relative;
    width: 46px;
    height: 26px;
    border-radius: 999px;
    background: #3b4445;
  }

  .toggle span::after {
    content: "";
    position: absolute;
    top: 3px;
    left: 3px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #eaf0f1;
    transition: transform 160ms ease;
  }

  .toggle input:checked + span {
    background: #2c8f57;
  }

  .toggle input:checked + span::after {
    transform: translateX(20px);
  }

  .actions {
    margin-top: auto;
  }

  button {
    width: 100%;
    min-height: 46px;
    border: 0;
    border-radius: 8px;
    color: #101313;
    background: #ffca3a;
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }

  button:disabled {
    color: #93a0a1;
    background: #313a3b;
    cursor: wait;
  }

  @media (max-width: 860px) {
    .app-shell {
      padding: 14px;
    }

    .workspace {
      grid-template-columns: 1fr;
      min-height: auto;
    }

    .camera-frame {
      min-height: 52vh;
    }
  }
</style>
