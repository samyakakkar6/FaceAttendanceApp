<template>
  <q-page class="kolam-light q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="disp" style="font-size:23px;color:#1E2A6E">Employees</div>
      <q-space />
      <q-btn outline color="primary" icon="refresh" label="Refresh" :loading="loading" @click="load" />
    </div>
    <q-table :rows="employees" :columns="columns" row-key="id" :loading="loading"
      flat bordered :filter="filter">
      <template #top-right>
        <q-input dense debounce="300" v-model="filter" placeholder="Search">
          <template #append><q-icon name="search" /></template>
        </q-input>
      </template>
      <template #body-cell-face="{ row }">
        <q-td class="text-center">
          <q-avatar size="40px" v-if="row.face_photo">
            <img :src="`${baseUrl}/uploads/${row.face_photo}`" />
          </q-avatar>
          <q-icon v-else name="no_photography" color="grey" />
        </q-td>
      </template>
      <template #body-cell-verified="{ row }">
        <q-td>
          <q-chip dense :color="row.is_verified ? 'positive' : 'warning'" text-color="white" size="sm">
            {{ row.is_verified ? 'Verified' : 'Pending' }}
          </q-chip>
        </q-td>
      </template>
      <template #body-cell-actions="{ row }">
        <q-td class="text-center">
          <q-btn flat round dense color="negative" icon="delete" @click="confirmDelete(row)" />
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { AdminApi } from 'src/api/admin.api';

const $q = useQuasar();
const baseUrl   = process.env.API_URL || 'http://localhost:3000';
const employees = ref([]);
const loading   = ref(true);
const filter    = ref('');

const columns = [
  { name: 'face',     label: 'Photo',   field: 'face_photo',  align: 'center' },
  { name: 'name',     label: 'Name',    field: 'name',        align: 'left', sortable: true },
  { name: 'email',    label: 'Email',   field: 'email',       align: 'left' },
  { name: 'phone',    label: 'Phone',   field: 'phone',       align: 'left' },
  { name: 'verified', label: 'Status',  field: 'is_verified', align: 'center' },
  { name: 'actions',  label: '',        field: 'id',          align: 'center' },
];

async function load() {
  loading.value = true;
  try {
    const { data } = await AdminApi.getEmployees();
    employees.value = data;
  } finally {
    loading.value = false;
  }
}

function confirmDelete(row) {
  $q.dialog({
    title: 'Delete employee',
    message: `Remove ${row.name} and all their attendance records? This can't be undone.`,
    cancel: true,
    ok: { label: 'Delete', color: 'negative' },
  }).onOk(async () => {
    try {
      await AdminApi.deleteEmployee(row.id);
      $q.notify({ type: 'positive', message: `${row.name} deleted` });
      load();
    } catch (err) {
      $q.notify({ type: 'negative', message: err.response?.data?.error ?? 'Delete failed' });
    }
  });
}

onMounted(load);
</script>
