import { ref, onUnmounted } from 'vue';

/**
 * Reactive GPS wrapper.
 * - `position`     — { lat, lng, accuracy } or null
 * - `error`        — string or null
 * - `loading`      — boolean
 * - `refresh()`    — trigger a one-shot position update
 * - `startWatch()` — start continuous watching
 */
export function useGeolocation() {
  const position = ref(null);
  const error    = ref(null);
  const loading  = ref(false);
  let watchId    = null;

  function onSuccess(pos) {
    position.value = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
    error.value    = null;
    loading.value  = false;
  }

  function onError(err) {
    error.value   = err.message ?? 'Location access denied';
    loading.value = false;
  }

  const HIGH_ACCURACY = { enableHighAccuracy: true, timeout: 12_000, maximumAge: 30_000 };
  const LOW_ACCURACY  = { enableHighAccuracy: false, timeout: 12_000, maximumAge: 120_000 };

  function refresh() {
    if (!navigator.geolocation) {
      error.value = 'Geolocation is not supported';
      return;
    }
    loading.value = true;
    // Try a precise fix first; if the OS can't get one (common on desktop /
    // indoors → kCLErrorLocationUnknown), fall back to a coarse network fix.
    navigator.geolocation.getCurrentPosition(
      onSuccess,
      () => navigator.geolocation.getCurrentPosition(onSuccess, onError, LOW_ACCURACY),
      HIGH_ACCURACY
    );
  }

  function startWatch() {
    if (!navigator.geolocation) { error.value = 'Geolocation not supported'; return; }
    watchId = navigator.geolocation.watchPosition(onSuccess, onError, LOW_ACCURACY);
  }

  onUnmounted(() => {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
  });

  return { position, error, loading, refresh, startWatch };
}
