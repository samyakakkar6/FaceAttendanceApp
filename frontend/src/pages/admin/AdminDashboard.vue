<template>
  <q-page class="kolam-light q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="disp" style="font-size:23px;color:#1E2A6E">Team today · {{ todayLabel }}</div>
      <q-space />
      <q-btn outline color="primary" icon="refresh" label="Refresh" :loading="loading" @click="load" />
    </div>

    <div class="row q-gutter-md q-mb-lg">
      <q-card class="col" v-for="s in statCards" :key="s.label">
        <q-card-section class="text-center">
          <q-icon :name="s.icon" :color="s.color" size="32px" />
          <div class="text-h4 text-weight-bold q-mt-xs" :class="`text-${s.color}`">{{ stats[s.key] ?? '–' }}</div>
          <div class="text-caption text-grey">{{ s.label }}</div>
        </q-card-section>
      </q-card>
    </div>

    <div class="text-subtitle1 q-mb-sm">Today's Punches</div>
    <q-table :rows="records" :columns="columns" row-key="id" :loading="loading"
      flat bordered dense @row-click="(_, row) => $router.push(`/admin/record/${row.id}`)">
      <template #body-cell-punch_in="{ value }"><q-td>{{ fmtTime(value) }}</q-td></template>
      <template #body-cell-punch_out="{ value }"><q-td>{{ fmtTime(value) }}</q-td></template>
      <template #body-cell-shift="{ row }"><q-td>{{ calcShift(row.punch_in, row.punch_out) }}</q-td></template>
      <template #body-cell-photo="{ row }">
        <q-td>
          <q-avatar size="36px" v-if="row.punch_in_photo">
            <img :src="AdminApi.photoUrl(row.punch_in_photo)" />
          </q-avatar>
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { AdminApi } from 'src/api/admin.api';

const loading = ref(true);
const stats   = ref({});
const records = ref([]);
const todayLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });

const statCards = [
  { key: 'total',      label: 'Total Employees', icon: 'group',           color: 'primary' },
  { key: 'present',    label: 'Present Today',   icon: 'event_available', color: 'positive' },
  { key: 'absent',     label: 'Absent Today',    icon: 'event_busy',      color: 'negative' },
  { key: 'punchedOut', label: 'Punched Out',      icon: 'logout',          color: 'orange' },
];

const columns = [
  { name: 'name',      label: 'Employee',  field: 'name',           align: 'left', sortable: true },
  { name: 'punch_in',  label: 'Punch In',  field: 'punch_in',       align: 'center' },
  { name: 'punch_out', label: 'Punch Out', field: 'punch_out',      align: 'center' },
  { name: 'shift',     label: 'Shift',     field: 'punch_in',       align: 'center' },
  { name: 'photo',     label: 'Photo',     field: 'punch_in_photo', align: 'center' },
];

function fmtTime(iso) { return iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'; }
function calcShift(i, o) {
  if (!i || !o) return '—';
  const ms = new Date(o) - new Date(i);
  return `${Math.floor(ms/3_600_000)}h ${Math.floor((ms%3_600_000)/60_000)}m`;
}

async function load() {
  loading.value = true;
  try {
    const today = new Date().toISOString().slice(0, 10);
    const [s, a] = await Promise.all([AdminApi.getStats(today), AdminApi.getAttendance(today)]);
    stats.value   = s.data;
    records.value = a.data;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>
