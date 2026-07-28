import { ref, onUnmounted } from 'vue';
import * as faceapi from '@vladmandic/face-api';

const MATCH_FRAMES_REQUIRED = 3;
const SCAN_INTERVAL_MS = 160;
// Blink-based liveness (defeats photo spoofing — a static image can't blink).
// Thresholds are RELATIVE to each person's open-eye baseline, because the tiny
// landmark model produces different EAR ranges per face/camera.
const EAR_CLOSE_RATIO = 0.80; // eyes considered closing below 80% of baseline
const EAR_OPEN_RATIO = 0.92;  // considered open again above 92% of baseline

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
// Eye aspect ratio from 6 face-api eye landmarks.
function eyeAspectRatio(eye) {
  return (dist(eye[1], eye[5]) + dist(eye[2], eye[4])) / (2 * dist(eye[0], eye[3]));
}

/**
 * Encapsulates all face-api.js camera + detection logic.
 *
 * @param {{ mode: 'register'|'verify', storedDescriptor?: number[], threshold?: number }} options
 * @param {{ onDetected, onMatch, onNoMatch }} callbacks
 */
export function useFaceScanner(options, callbacks) {
  const { mode, storedDescriptor = null, threshold = 0.45 } = options;
  // A valid face-api descriptor is exactly 128 floats. Anything else (null,
  // empty array, corrupt) must NOT be treated as a match-anything wildcard.
  const validStored = Array.isArray(storedDescriptor) && storedDescriptor.length === 128;
  const { onDetected, onMatch, onNoMatch } = callbacks;

  const videoEl  = ref(null);
  const canvasEl = ref(null);
  const status   = ref('Position your face in the oval');
  const state    = ref('idle'); // idle | scanning | success | error

  let stream       = null;
  let intervalId   = null;
  let matchCount   = 0;
  let eyesClosed   = false;
  let blinkDone    = false; // liveness: a real blink was observed this session
  let earBaseline  = 0;     // running max EAR = the person's open-eye reference

  // On Cordova/Android, getUserMedia only works once the native CAMERA runtime
  // permission is granted. Request it right before opening the camera (doing it
  // on deviceready is unreliable — that event can fire before listeners attach).
  function ensureCameraPermission() {
    return new Promise(resolve => {
      const perms = window.cordova?.plugins?.permissions;
      if (!perms) return resolve(); // web/PWA — browser handles the prompt
      perms.checkPermission(perms.CAMERA, status => {
        if (status.hasPermission) return resolve();
        perms.requestPermission(perms.CAMERA, () => resolve(), () => resolve());
      }, () => resolve());
    });
  }

  async function start() {
    blinkDone = false;
    eyesClosed = false;
    matchCount = 0;
    earBaseline = 0;
    try {
      await ensureCameraPermission();
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false,
      });
      videoEl.value.srcObject = stream;
      videoEl.value.onloadedmetadata = () => {
        state.value = 'scanning';
        _startDetectionLoop();
      };
    } catch (err) {
      status.value = err?.name === 'NotAllowedError'
        ? 'Camera permission denied — enable it in Settings'
        : 'Camera not available';
      state.value = 'error';
    }
  }

  function stop() {
    clearInterval(intervalId);
    stream?.getTracks().forEach(t => t.stop());
    intervalId = null;
    stream     = null;
  }

  function captureSnapshot() {
    const c = document.createElement('canvas');
    c.width  = videoEl.value.videoWidth;
    c.height = videoEl.value.videoHeight;
    c.getContext('2d').drawImage(videoEl.value, 0, 0);
    return c.toDataURL('image/jpeg', 0.85);
  }

  function _startDetectionLoop() {
    const displaySize = { width: videoEl.value.videoWidth, height: videoEl.value.videoHeight };
    faceapi.matchDimensions(canvasEl.value, displaySize);

    intervalId = setInterval(async () => {
      // The element refs may go null if the component unmounts mid-cycle.
      if (!videoEl.value || !canvasEl.value) return;

      const detections = await faceapi
        .detectAllFaces(videoEl.value, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks(true)
        .withFaceDescriptors();

      // Re-check after the await — the component may have unmounted by now.
      if (!videoEl.value || !canvasEl.value) return;

      const resized = faceapi.resizeResults(detections, displaySize);
      const ctx = canvasEl.value.getContext('2d');
      ctx.clearRect(0, 0, canvasEl.value.width, canvasEl.value.height);
      faceapi.draw.drawDetections(canvasEl.value, resized);
      faceapi.draw.drawFaceLandmarks(canvasEl.value, resized);

      if (detections.length === 0) {
        status.value = 'No face detected';
        state.value  = 'scanning';
        matchCount   = 0;
        return;
      }
      if (detections.length > 1) {
        status.value = 'Multiple faces — use one face only';
        state.value  = 'error';
        return;
      }

      const descriptor = Array.from(detections[0].descriptor);

      // ── Liveness: require a blink before accepting the face. A photo held up
      // to the camera stays static and can never satisfy this. ──
      if (!blinkDone) {
        const lm = detections[0].landmarks;
        const ear = (eyeAspectRatio(lm.getLeftEye()) + eyeAspectRatio(lm.getRightEye())) / 2;
        // Track the open-eye baseline (max EAR seen so far).
        if (ear > earBaseline) earBaseline = ear;
        if (earBaseline > 0) {
          if (ear < earBaseline * EAR_CLOSE_RATIO) eyesClosed = true;
          else if (eyesClosed && ear > earBaseline * EAR_OPEN_RATIO) { blinkDone = true; eyesClosed = false; }
        }

        if (!blinkDone) {
          status.value = 'Blink once to confirm you are live';
          state.value  = 'scanning';
          matchCount   = 0;
          return;
        }
      }

      if (mode === 'register') {
        status.value = 'Face detected – ready to capture';
        state.value  = 'success';
        onDetected?.({ descriptor, detection: detections[0] });
        return;
      }

      if (mode === 'verify') {
        if (!validStored) {
          status.value = 'No valid registered face — please re-register';
          state.value  = 'error';
          return;
        }
        const distance = faceapi.euclideanDistance(
          new Float32Array(storedDescriptor),
          new Float32Array(descriptor)
        );
        if (distance < threshold) {
          matchCount++;
          status.value = `Match confirmed (${((1 - distance) * 100).toFixed(0)}%)`;
          state.value  = 'success';
          if (matchCount >= MATCH_FRAMES_REQUIRED) {
            clearInterval(intervalId);
            onMatch?.({ descriptor, snapshot: captureSnapshot(), distance });
          }
        } else {
          matchCount   = 0;
          status.value = 'Face not recognised – hold still';
          state.value  = 'error';
          onNoMatch?.({ distance });
        }
      }
    }, SCAN_INTERVAL_MS);
  }

  onUnmounted(stop);

  return { videoEl, canvasEl, status, state, start, stop, captureSnapshot };
}
