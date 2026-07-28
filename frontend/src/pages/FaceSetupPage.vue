<template>
  <q-page class="kolam-dark flex flex-center q-pa-md">
    <BlockPrintBand dark class="absolute-top" />
    <q-card style="width:420px;max-width:100%;background:#1C1626;color:#FBF3E2" class="shadow-4">
      <q-card-section class="text-center">
        <q-icon name="face_retouching_natural" size="44px" color="secondary" />
        <div class="disp q-mt-sm" style="font-size:24px;color:#FBF3E2">Register your face</div>
        <div class="text-caption" style="color:#C3B8A0">One-time setup, so each punch is just a glance.</div>
      </q-card-section>

      <q-card-section>
        <q-stepper v-model="step" color="secondary" animated flat dark style="background:transparent">
          <q-step :name="1" title="Prepare" icon="info" :done="step > 1">
            <ul class="text-body2 q-mb-md">
              <li>Ensure good, even lighting</li>
              <li>Remove glasses if possible</li>
              <li>Look directly at the camera</li>
              <li>Keep a neutral expression</li>
            </ul>
            <div class="trust-line q-mb-md" style="color:#C3B8A0;justify-content:flex-start">
              <q-icon name="shield" color="secondary" size="16px" />Only a 128-number descriptor is stored — never your photo.
            </div>
            <q-btn label="Start camera" color="secondary" text-color="primary" unelevated
              style="font-weight:700" @click="step = 2" />
          </q-step>

          <q-step :name="2" title="Scan Face" icon="videocam" :done="step > 2">
            <div class="relative-position" style="height:300px">
              <FaceScanner
                v-if="step === 2"
                ref="scannerRef"
                mode="register"
                @detected="onDetected"
              />
            </div>
            <q-btn
              v-if="detectedDescriptor"
              label="Capture face"
              color="secondary"
              text-color="primary"
              unelevated
              class="full-width q-mt-md"
              style="height:52px;border-radius:14px;font-weight:700"
              :loading="saving"
              @click="save"
            />
          </q-step>

          <q-step :name="3" title="Done" icon="check_circle">
            <div class="text-center q-py-lg">
              <q-icon name="check_circle" size="64px" color="positive" />
              <div class="text-h6 q-mt-md">Face Registered!</div>
              <div class="text-caption text-grey q-mb-lg">
                You can now use facial recognition to mark attendance.
              </div>
              <q-btn label="Go to Dashboard" color="primary" @click="$router.replace(auth.isAdmin ? '/admin' : '/dashboard')" />
            </div>
          </q-step>
        </q-stepper>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { FaceApi } from 'src/api/face.api';
import { useAuthStore } from 'src/stores/auth';
import FaceScanner from 'src/components/FaceScanner.vue';
import BlockPrintBand from 'src/components/BlockPrintBand.vue';

const $q    = useQuasar();
const auth  = useAuthStore();
const step  = ref(1);
const detectedDescriptor = ref(null);
const scannerRef = ref(null);
const saving = ref(false);

function onDetected({ descriptor }) {
  detectedDescriptor.value = descriptor;
  // The actual photo is captured live from the scanner on "Capture & Save".
}

async function save() {
  if (!detectedDescriptor.value) return;
  saving.value = true;
  try {
    // Grab a live JPEG snapshot from the running scanner.
    const snapshot = scannerRef.value?.captureSnapshot();
    if (!snapshot) throw new Error('Could not capture a photo. Please try again.');

    const formData = new FormData();
    formData.append('descriptor', JSON.stringify(detectedDescriptor.value));

    const photoBlob = await (await fetch(snapshot)).blob();
    formData.append('photo', photoBlob, 'face.jpg');

    const { data } = await FaceApi.register(formData);
    auth.updateFaceDescriptor(JSON.stringify(detectedDescriptor.value));
    if (data?.face_photo) auth.setUser({ ...auth.user, face_photo: data.face_photo });
    step.value = 3;
  } catch (err) {
    $q.notify({ type: 'negative', message: err.response?.data?.error ?? 'Face registration failed' });
  } finally {
    saving.value = false;
  }
}
</script>
