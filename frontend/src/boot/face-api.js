import { boot } from 'quasar/wrappers';
import * as faceapi from '@vladmandic/face-api';

export default boot(async () => {
  // Initialise the TensorFlow.js backend before any inference runs.
  // Without this, face-api's bundled tfjs may try to use an unregistered
  // backend and throw "Cannot read properties of undefined (reading 'backend')".
  await faceapi.tf.setBackend('webgl');
  await faceapi.tf.ready();

  // Models are served from /models in the public folder
  // Prefix with the deploy base path so models resolve on GitHub Pages subpath.
  const MODEL_URL = `${process.env.APP_BASE || ''}/models`;
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);
  console.log('face-api.js models loaded');
});
