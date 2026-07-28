<template>
  <q-page class="kolam-light q-pa-md" v-if="record">
    <q-btn flat icon="arrow_back" label="Back" color="primary" @click="$router.back()" class="q-mb-sm" />
    <div class="row items-center q-gutter-sm q-mb-md">
      <q-avatar size="42px" style="background:#1E2A6E;color:#F4A300;font-weight:700">{{ initials }}</q-avatar>
      <div class="col">
        <div class="disp" style="font-size:19px;color:#1E2A6E">{{ record.name }}</div>
        <div style="font-size:12px;color:#8A7D66">{{ record.email }}</div>
      </div>
    </div>

    <!-- shift duration card (indigo) -->
    <div class="q-pa-md text-center" style="background:#1E2A6E;border-radius:18px;color:#FBF3E2">
      <div class="lab" style="color:#B9C0E6;margin:0">Shift duration</div>
      <div style="font-weight:800;font-size:34px;color:#F4A300">
        {{ !record.punch_out ? 'In progress' : (record.completed ? record.shift : 'Not completed') }}
      </div>
      <div style="font-size:13px;color:#B9C0E6">
        {{ fmt(record.punch_in) }}{{ record.punch_out ? ' — ' + fmt(record.punch_out) : ' — in progress' }}
        <span v-if="record.punch_out && !record.completed"> · under 1 min</span>
      </div>
    </div>

    <!-- punch in -->
    <div class="dmag-card q-pa-md q-mt-md row q-gutter-md no-wrap">
      <q-img v-if="record.punch_in_photo" :src="AdminApi.photoUrl(record.punch_in_photo)"
        style="width:66px;height:78px;border-radius:10px;flex:0 0 auto" fit="cover" />
      <div v-else style="width:66px;height:78px;border-radius:10px;border:1px solid #EFE6D0" class="flex flex-center"><q-icon name="no_photography" color="grey" /></div>
      <div class="col">
        <div class="row items-center justify-between">
          <span class="text-positive text-weight-bold" style="font-size:13px">● PUNCH IN</span>
          <span class="text-weight-bold" style="color:#1E2A6E">{{ fmtTime(record.punch_in) }}</span>
        </div>
        <div class="mono" style="font-size:12px;color:#8A7D66;margin-top:6px">
          {{ record.lat ? `${record.lat.toFixed(4)}, ${record.lng.toFixed(4)}` : 'No location' }}
        </div>
      </div>
    </div>

    <!-- punch out -->
    <div class="dmag-card q-pa-md q-mt-sm row q-gutter-md no-wrap"
      :style="record.punch_out ? '' : 'border-style:dashed;background:#FAF5EA'">
      <q-img v-if="record.punch_out_photo" :src="AdminApi.photoUrl(record.punch_out_photo)"
        style="width:66px;height:78px;border-radius:10px;flex:0 0 auto" fit="cover" />
      <div v-else style="width:66px;height:78px;border-radius:10px;border:1px dashed #D8CBA8" class="flex flex-center"><q-icon name="schedule" color="grey" /></div>
      <div class="col flex flex-center" style="align-items:flex-start;flex-direction:column;justify-content:center">
        <span class="text-weight-bold" style="font-size:13px;color:#A08C66">○ PUNCH OUT</span>
        <div style="font-size:13px;color:#8A7D66;margin-top:4px">
          {{ record.punch_out ? fmtTime(record.punch_out) : 'Still on shift — no punch-out yet.' }}
        </div>
      </div>
    </div>
  </q-page>
  <q-page v-else class="flex flex-center"><q-spinner size="48px" /></q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { AdminApi } from 'src/api/admin.api';

const route  = useRoute();
const record = ref(null);

function fmt(iso) { return iso ? new Date(iso).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'; }
function fmtTime(iso) { return iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'; }

const initials = computed(() =>
  (record.value?.name ?? '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
);

onMounted(async () => {
  const { data } = await AdminApi.getRecord(route.params.id);
  record.value = data;
});
</script>
