<template>
  <q-page class="kolam-light q-pa-md">
    <div class="q-mb-md">
      <div style="font-size:14px;color:#8A7D66;font-weight:600">{{ todayLabel }}</div>
      <div class="disp" style="font-size:26px;color:#1E2A6E">Welcome, {{ auth.user?.name }}</div>
    </div>

    <!-- Geofence card -->
    <div class="dmag-card q-pa-md q-mb-md row items-center no-wrap"
      :style="insideGeofence ? '' : 'background:#FBEEEC;border-color:#F0D3CE'">
      <MandalaGeofence :inside="insideGeofence" :size="64" class="q-mr-md" />
      <div class="col">
        <div class="row items-center q-gutter-xs">
          <span :style="`width:8px;height:8px;border-radius:50%;background:${insideGeofence ? '#2F7D4F' : '#C0392B'}`" />
          <span class="text-weight-bold" :style="`color:${insideGeofence ? '#1E2A6E' : '#C0392B'}`">
            {{ geoStatusLabel }}
          </span>
        </div>
        <div v-if="geoPosition" class="mono" style="font-size:12px;color:#8A7D66;margin-top:4px">
          {{ geoPosition.lat.toFixed(4) }}, {{ geoPosition.lng.toFixed(4) }}<span v-if="distanceM !== null"> · {{ distanceM }} m away</span>
        </div>
      </div>
      <q-btn flat round dense icon="refresh" color="primary" :loading="geoLoading" @click="refreshGeo" />
    </div>

    <!-- Today's record -->
    <q-card class="attendance-card q-mb-md" :class="attendance.isPunchedOut ? 'punched-out' : ''">
      <q-card-section>
        <div class="text-subtitle1 text-weight-bold">Today – {{ todayLabel }}</div>
        <div class="row q-mt-sm q-gutter-md">
          <div>
            <div class="text-caption text-grey">Punch In</div>
            <div class="text-body1 text-weight-medium">{{ fmt(attendance.today?.punch_in) }}</div>
          </div>
          <div>
            <div class="text-caption text-grey">Punch Out</div>
            <div class="text-body1 text-weight-medium">{{ fmt(attendance.today?.punch_out) }}</div>
          </div>
          <div v-if="attendance.shiftDuration">
            <div class="text-caption text-grey">Shift</div>
            <div class="text-body1 text-weight-medium" :class="shiftIncomplete ? 'text-negative' : 'text-positive'">{{ attendance.shiftDuration }}</div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Scan-to-punch lotus circle -->
    <div class="column items-center q-mt-md">
      <template v-if="!attendance.isPunchedOut">
        <div
          :class="{ 'cursor-pointer': canScan }"
          :style="`position:relative;width:184px;height:184px;display:flex;align-items:center;justify-content:center;${canScan ? '' : 'opacity:.5'}`"
          @click="canScan && openScan(attendance.isPunchedIn ? 'out' : 'in')"
        >
          <LotusScanFrame />
          <div class="column flex-center" style="width:148px;height:148px;border-radius:50%;background:#FFFDF7;border:2px solid #1E2A6E;box-shadow:0 16px 34px -16px rgba(30,42,110,.5);text-align:center">
            <q-icon name="center_focus_strong" size="34px" color="primary" />
            <div class="disp" style="font-size:18px;color:#1E2A6E;margin-top:6px">
              Scan to punch {{ attendance.isPunchedIn ? 'out' : 'in' }}
            </div>
            <div style="font-size:12px;color:#A08C66;margin-top:2px">Tap to scan your face</div>
          </div>
        </div>
        <div class="trust-line q-mt-md">
          <q-icon name="shield" color="positive" size="14px" />On device — no photo leaves your phone
        </div>
      </template>
      <q-chip v-else-if="shiftIncomplete" color="negative" icon="error" text-color="white" size="lg">
        Shift not completed – under 1 min
      </q-chip>
      <q-chip v-else color="positive" icon="check_circle" text-color="white" size="lg">
        Shift complete – {{ attendance.shiftDuration }}
      </q-chip>
    </div>

    <!-- No face banner -->
    <q-banner v-if="!auth.hasFace" inline-actions class="bg-orange-1 q-mt-lg" rounded>
      <template #avatar><q-icon name="warning" color="warning" /></template>
      Face not registered yet.
      <template #action>
        <q-btn flat color="warning" label="Register Now" to="/face-setup" />
      </template>
    </q-banner>

    <!-- Face scan dialog -->
    <q-dialog v-model="scanOpen" persistent>
      <q-card style="width:400px;max-width:95vw">
        <q-card-section class="text-center">
          <q-icon name="face_retouching_natural" size="40px" :color="scanType === 'in' ? 'positive' : 'negative'" />
          <div class="text-h6 q-mt-xs">Face Scan – Punch {{ scanType === 'in' ? 'In' : 'Out' }}</div>
        </q-card-section>

        <q-card-section>
          <div style="height:280px;position:relative">
            <FaceScanner
              v-if="scanOpen"
              mode="verify"
              :stored-descriptor="storedDescriptor"
              @match="onMatch"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Punch success -->
    <q-dialog v-model="successOpen">
      <q-card class="kolam-light q-pa-lg text-center" style="width:340px;max-width:92vw">
        <div class="column flex-center">
          <div class="flex flex-center" style="width:92px;height:92px;border-radius:50%;background:#2F7D4F;box-shadow:0 16px 30px -12px rgba(47,125,79,.7)">
            <q-icon name="check" color="white" size="46px" />
          </div>
        </div>
        <div class="disp q-mt-md" style="font-size:28px;color:#1E2A6E">
          Punched {{ success?.type === 'in' ? 'in' : 'out' }}!
        </div>
        <div style="font-size:15px;color:#2F7D4F">Attendance recorded successfully</div>
        <div style="font-weight:800;font-size:34px;color:#1E2A6E;margin-top:10px">{{ success?.time }}</div>
        <div style="font-size:13px;color:#8A7D66">{{ todayLabel }}</div>

        <div class="dmag-card q-pa-sm q-mt-md row items-center q-gutter-sm no-wrap text-left">
          <q-img v-if="success?.snapshot" :src="success.snapshot" style="width:48px;height:54px;border-radius:8px;flex:0 0 auto" fit="cover" />
          <div class="col">
            <div class="text-weight-bold" style="font-size:13px;color:#1E2A6E">Punch photo saved</div>
            <div class="row q-gutter-xs q-mt-xs">
              <q-chip dense size="sm" style="background:#EAF3EE;color:#2F7D4F">{{ success?.match }}% match</q-chip>
              <q-chip dense size="sm" style="background:#EEF0FA;color:#1E2A6E">In geofence</q-chip>
            </div>
          </div>
        </div>

        <q-btn label="Done" color="primary" unelevated class="full-width q-mt-md"
          style="height:48px;border-radius:14px;font-weight:700" v-close-popup />
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore }       from 'src/stores/auth';
import { useAttendanceStore } from 'src/stores/attendance.store';
import { useGeolocation }     from 'src/composables/useGeolocation';
import { useAttendance }      from 'src/composables/useAttendance';
import FaceScanner            from 'src/components/FaceScanner.vue';
import MandalaGeofence        from 'src/components/MandalaGeofence.vue';
import LotusScanFrame         from 'src/components/LotusScanFrame.vue';
import client                 from 'src/api/client';

const auth       = useAuthStore();
const attendance = useAttendanceStore();
const { punch }  = useAttendance();

const { position: geoPosition, error: geoError, loading: geoLoading, refresh: refreshGeo, startWatch } = useGeolocation();

const locationReady = computed(() => !!geoPosition.value && !geoError.value);

// Office geofence (fetched from the backend) + real distance check.
const geofence = ref(null);
function haversineM(lat1, lng1, lat2, lng2) {
  const R = 6_371_000, toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
const distanceM = computed(() => {
  if (!geoPosition.value || !geofence.value) return null;
  return Math.round(haversineM(geofence.value.lat, geofence.value.lng, geoPosition.value.lat, geoPosition.value.lng));
});
const insideGeofence = computed(() =>
  locationReady.value && geofence.value != null && distanceM.value !== null &&
  distanceM.value <= geofence.value.radius
);
const geoStatusLabel = computed(() => {
  if (geoError.value) return geoError.value;
  if (!geoPosition.value) return 'Acquiring location…';
  if (!geofence.value) return 'Checking geofence…';
  return insideGeofence.value ? 'Inside geofence' : 'Outside geofence';
});
const canScan = computed(() =>
  insideGeofence.value && (attendance.isPunchedIn ? !attendance.isPunchedOut : auth.hasFace)
);
const shiftIncomplete = computed(() => attendance.shiftDuration === 'Not completed');
const scanOpen  = ref(false);
const scanType  = ref('in');
const successOpen = ref(false);
const success     = ref(null);

const todayLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

const storedDescriptor = computed(() => {
  const d = auth.user?.face_descriptor;
  if (!d) return null;
  try { return JSON.parse(d); } catch { return null; }
});

function fmt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function openScan(type) {
  scanType.value = type;
  scanOpen.value = true;
}

async function onMatch({ snapshot, distance }) {
  scanOpen.value = false;
  const result = await punch(scanType.value, {
    lat: geoPosition.value.lat,
    lng: geoPosition.value.lng,
    snapshot,
  });
  if (result.success) {
    success.value = {
      type: scanType.value,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      snapshot,
      match: Math.round((1 - (distance ?? 0)) * 100),
    };
    successOpen.value = true;
  } else if (result.outsideGeofence) {
    refreshGeo();
  }
}

onMounted(async () => {
  startWatch();
  attendance.fetchToday();
  try {
    const { data } = await client.get('/geofence');
    geofence.value = data;
  } catch { /* keep advisory; server still enforces on punch */ }
});
</script>
