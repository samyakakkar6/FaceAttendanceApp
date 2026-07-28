<template>
  <q-page class="kolam-light q-pa-md">
    <div class="disp q-mb-md" style="font-size:24px;color:#1E2A6E">My attendance</div>

    <q-list bordered separator rounded>
      <q-item v-if="attendance.loading">
        <q-item-section><q-skeleton type="text" /></q-item-section>
      </q-item>

      <q-item v-for="rec in attendance.history" :key="rec.id"
        class="attendance-card" :class="rec.punch_out ? 'punched-out' : ''">
        <q-item-section>
          <q-item-label>{{ fmtDate(rec.date) }}</q-item-label>
          <q-item-label caption>
            In: {{ fmtTime(rec.punch_in) }} &nbsp;|&nbsp; Out: {{ fmtTime(rec.punch_out) }}
            <span v-if="rec.punch_in && rec.punch_out" class="q-ml-sm"
              :class="isComplete(rec) ? 'text-positive' : 'text-negative'">
              {{ isComplete(rec) ? calcShift(rec.punch_in, rec.punch_out) : 'Not completed' }}
            </span>
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-chip dense size="sm" text-color="white"
            :color="!rec.punch_out ? 'orange' : (isComplete(rec) ? 'positive' : 'negative')">
            {{ !rec.punch_out ? 'Partial' : (isComplete(rec) ? 'Complete' : 'Not completed') }}
          </q-chip>
        </q-item-section>
      </q-item>

      <q-item v-if="!attendance.loading && !attendance.history.length">
        <q-item-section class="text-center text-grey q-py-lg">No records yet</q-item-section>
      </q-item>
    </q-list>
  </q-page>
</template>

<script setup>
import { onMounted } from 'vue';
import { useAttendanceStore } from 'src/stores/attendance.store';

const attendance = useAttendanceStore();

onMounted(() => attendance.fetchHistory());

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
function isComplete(rec) {
  if (!rec.punch_in || !rec.punch_out) return false;
  return (new Date(rec.punch_out) - new Date(rec.punch_in)) >= 60_000;
}
function calcShift(in_, out_) {
  const ms = new Date(out_) - new Date(in_);
  const s = Math.floor((ms % 60_000) / 1_000);
  return `${Math.floor(ms/3_600_000)}h ${Math.floor((ms%3_600_000)/60_000)}m ${s}s`;
}
</script>
