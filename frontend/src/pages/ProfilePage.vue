<template>
  <q-page class="kolam-light q-pa-md">
    <div class="disp q-mb-md" style="font-size:24px;color:#1E2A6E">Profile</div>
    <q-card class="dmag-card q-mb-md" flat>
      <q-card-section class="row items-center q-gutter-md">
        <q-avatar size="72px" color="primary" text-color="white" font-size="36px">
          <img v-if="facePhotoUrl" :src="facePhotoUrl" alt="Face" />
          <template v-else>{{ auth.user?.name?.[0]?.toUpperCase() }}</template>
        </q-avatar>
        <div>
          <div class="text-h6">{{ auth.user?.name }}</div>
          <div class="text-caption text-grey">{{ auth.user?.email }}</div>
          <q-chip dense :color="auth.hasFace ? 'positive' : 'warning'" text-color="white" size="sm" class="q-mt-xs">
            {{ auth.hasFace ? 'Face Registered' : 'Face Not Set' }}
          </q-chip>
        </div>
      </q-card-section>
    </q-card>

    <q-btn v-if="!auth.hasFace" label="Register Face" color="primary" icon="face" to="/face-setup" class="full-width q-mb-md" />
    <q-btn v-else label="Re-register Face" color="warning" icon="refresh" to="/face-setup" class="full-width q-mb-md" />
  </q-page>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from 'src/stores/auth';
const auth = useAuthStore();
const baseUrl = process.env.API_URL || 'http://localhost:3000';
const facePhotoUrl = computed(() =>
  auth.user?.face_photo ? `${baseUrl}/uploads/${auth.user.face_photo}` : null
);
</script>
