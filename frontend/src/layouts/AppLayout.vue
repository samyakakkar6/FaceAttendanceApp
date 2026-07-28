<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="bg-primary text-white">
      <q-toolbar>
        <q-btn flat dense round icon="menu" @click="drawer = !drawer" />
        <q-toolbar-title class="row items-center no-wrap">
          <svg width="22" height="22" viewBox="0 0 24 24" class="q-mr-sm">
            <circle cx="12" cy="12" r="5" fill="#f4a300" />
            <g stroke="#f4a300" stroke-width="1.8" stroke-linecap="round" fill="none">
              <path d="M12 2v2.5M12 19.5v2.5M2 12h2.5M19.5 12h2.5M4.8 4.8l1.8 1.8M17.4 17.4l1.8 1.8M19.2 4.8l-1.8 1.8M6.6 17.4l-1.8 1.8" />
            </g>
          </svg>
          <span class="brandname" style="font-size:18px">Dekho Mai Aagya!</span>
        </q-toolbar-title>
        <div class="row items-center q-gutter-xs">
          <span class="geofence-indicator" :class="geoStatus" />
          <span class="text-caption">{{ geoLabel }}</span>
        </div>
      </q-toolbar>
      <BlockPrintBand dark />
    </q-header>

    <q-drawer v-model="drawer" show-if-above bordered>
      <q-list>
        <q-item-label header>{{ auth.user?.name }}</q-item-label>
        <q-item-label caption class="q-px-md q-pb-sm text-grey">{{ auth.user?.email }}</q-item-label>
        <q-separator />

        <template v-if="!auth.isAdmin">
          <q-item clickable to="/dashboard" exact>
            <q-item-section avatar><q-icon name="dashboard" /></q-item-section>
            <q-item-section>Dashboard</q-item-section>
          </q-item>
          <q-item clickable to="/dashboard/history">
            <q-item-section avatar><q-icon name="history" /></q-item-section>
            <q-item-section>My Attendance</q-item-section>
          </q-item>
          <q-item clickable to="/dashboard/profile">
            <q-item-section avatar><q-icon name="person" /></q-item-section>
            <q-item-section>Profile</q-item-section>
          </q-item>
        </template>

        <template v-else>
          <q-item clickable to="/admin" exact>
            <q-item-section avatar><q-icon name="admin_panel_settings" /></q-item-section>
            <q-item-section>Admin Dashboard</q-item-section>
          </q-item>
          <q-item clickable to="/admin/employees">
            <q-item-section avatar><q-icon name="group" /></q-item-section>
            <q-item-section>Employees</q-item-section>
          </q-item>
          <q-item clickable to="/admin/attendance">
            <q-item-section avatar><q-icon name="event_available" /></q-item-section>
            <q-item-section>Attendance Records</q-item-section>
          </q-item>
        </template>

        <q-separator class="q-mt-auto" />
        <q-item clickable @click="logout" class="text-negative">
          <q-item-section avatar><q-icon name="logout" /></q-item-section>
          <q-item-section>Logout</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';
import BlockPrintBand from 'src/components/BlockPrintBand.vue';

const auth = useAuthStore();
const router = useRouter();
const drawer = ref(false);
const geoStatus = ref('outside');
const geoLabel = ref('Locating...');

let watchId = null;

function startGeoWatch() {
  if (!navigator.geolocation) { geoLabel.value = 'No GPS'; return; }
  watchId = navigator.geolocation.watchPosition(
    pos => {
      // Status updated via attendance store after API call
      geoStatus.value = 'inside';
      geoLabel.value = 'GPS active';
    },
    () => { geoStatus.value = 'outside'; geoLabel.value = 'GPS error'; },
    { enableHighAccuracy: true, maximumAge: 10000 }
  );
}

onMounted(startGeoWatch);
onUnmounted(() => { if (watchId) navigator.geolocation.clearWatch(watchId); });

function logout() {
  auth.logout();
  router.replace('/login');
}
</script>
