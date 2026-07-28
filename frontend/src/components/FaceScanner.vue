<template>
  <div class="face-scanner relative-position full-width full-height">
    <video ref="videoEl" autoplay muted playsinline class="full-width full-height"
      style="border-radius:12px;background:#000;object-fit:cover" />
    <canvas ref="canvasEl" class="absolute-full" style="border-radius:12px" />

    <div class="face-scan-overlay" :class="state === 'success' ? 'success' : state === 'error' ? 'error' : 'scanning'" />

    <div class="absolute-bottom text-center q-pb-md">
      <q-chip
        :color="state === 'success' ? 'positive' : state === 'error' ? 'negative' : 'primary'"
        text-color="white"
        :icon="state === 'success' ? 'check_circle' : state === 'error' ? 'cancel' : 'center_focus_weak'"
        dense
      >
        {{ status }}
      </q-chip>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useFaceScanner } from 'src/composables/useFaceScanner';

const props = defineProps({
  mode:             { type: String,  default: 'detect' },
  storedDescriptor: { type: Array,   default: null },
  threshold:        { type: Number,  default: 0.5 },
});

const emit = defineEmits(['detected', 'match', 'no-match']);

const { videoEl, canvasEl, status, state, start, stop, captureSnapshot } = useFaceScanner(
  { mode: props.mode, storedDescriptor: props.storedDescriptor, threshold: props.threshold },
  {
    onDetected: payload => emit('detected', payload),
    onMatch:    payload => emit('match',    payload),
    onNoMatch:  payload => emit('no-match', payload),
  }
);

onMounted(start);

defineExpose({ captureSnapshot, stop });
</script>
