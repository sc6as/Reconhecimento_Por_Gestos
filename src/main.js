import './style.css';
import {
  HandLandmarker,
  FilesetResolver,
  DrawingUtils
} from '@mediapipe/tasks-vision';

const video = document.getElementById('webcam');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const gestureText = document.getElementById('gesture');
const actionText = document.getElementById('action');

canvas.width = 640;
canvas.height = 480;

let handLandmarker;
let lastActionTime = 0;
const COOLDOWN = 2500;

async function setupCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false
  });

  video.srcObject = stream;

  return new Promise((resolve) => {
    video.onloadedmetadata = () => resolve(video);
  });
}

async function setupHandLandmarker() {
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  );

  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'
    },
    runningMode: 'VIDEO',
    numHands: 1
  });
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function isFingerOpen(landmarks, tip, pip) {
  return landmarks[tip].y < landmarks[pip].y;
}

function detectGesture(landmarks) {
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];

  const indexOpen = isFingerOpen(landmarks, 8, 6);
  const middleOpen = isFingerOpen(landmarks, 12, 10);
  const ringOpen = isFingerOpen(landmarks, 16, 14);
  const pinkyOpen = isFingerOpen(landmarks, 20, 18);

  const pinch = distance(thumbTip, indexTip) < 0.05;

  if (pinch) return 'PINÇA';
  if (indexOpen && !middleOpen && !ringOpen && !pinkyOpen) return 'APONTAR';
  if (indexOpen && middleOpen && ringOpen && pinkyOpen) return 'MÃO_ABERTA';
  if (!indexOpen && !middleOpen && !ringOpen && !pinkyOpen) return 'PUNHO';

  return 'DESCONHECIDO';
}

function executarAcao(gesture) {
  const now = Date.now();

  if (now - lastActionTime < COOLDOWN) return;

  if (gesture === 'MÃO_ABERTA') {
    actionText.textContent = 'Ação: abrir Google';
    window.open('https://www.google.com', '_blank');
    lastActionTime = now;
  }

  if (gesture === 'APONTAR') {
    actionText.textContent = 'Ação: abrir Spotify Web';
    window.open('https://open.spotify.com', '_blank');
    lastActionTime = now;
  }

  if (gesture === 'PINÇA') {
    actionText.textContent = 'Ação: abrir YouTube';
    window.open('https://www.youtube.com', '_blank');
    lastActionTime = now;
  }

  if (gesture === 'PUNHO') {
    actionText.textContent = 'Ação: nenhuma / bloquear comandos';
    lastActionTime = now;
  }
}

async function predict() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const results = handLandmarker.detectForVideo(video, performance.now());
  const drawingUtils = new DrawingUtils(ctx);

  if (results.landmarks.length > 0) {
    const landmarks = results.landmarks[0];

    drawingUtils.drawConnectors(
      landmarks,
      HandLandmarker.HAND_CONNECTIONS,
      { lineWidth: 4 }
    );

    drawingUtils.drawLandmarks(landmarks, {
      radius: 4,
      lineWidth: 2
    });

    const gesture = detectGesture(landmarks);
    gestureText.textContent = `Gesto: ${gesture}`;
    executarAcao(gesture);
  } else {
    gestureText.textContent = 'Gesto: nenhum';
  }

  requestAnimationFrame(predict);
}

async function main() {
  try {
    await setupCamera();
    await setupHandLandmarker();
    predict();
  } catch (error) {
    console.error(error);
    actionText.textContent = 'Erro: não foi possível iniciar a câmara.';
  }
}

main();