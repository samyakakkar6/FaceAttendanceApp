<template>
  <q-page class="kolam-light column flex-center q-py-lg" style="min-height:100vh">
    <BlockPrintBand class="absolute-top" />

    <div class="dmag-card q-pa-lg q-mt-md" style="width:360px;max-width:92vw">
      <div class="text-center">
        <q-icon name="person_add" size="40px" color="primary" />
        <div class="disp q-mt-sm" style="font-size:24px;color:#1E2A6E">Create account</div>
        <div style="font-size:14px;color:#8A7D66;margin-top:4px">Set up once, then punch in with a glance.</div>
      </div>

      <q-form @submit.prevent="register" class="q-gutter-md q-mt-md">
          <q-input v-model="form.name" label="Full Name" outlined dense :rules="[v => !!v || 'Required']">
            <template #prepend><q-icon name="person" /></template>
          </q-input>
          <q-input v-model="form.email" label="Email" type="email" outlined dense
            :rules="[v => !!v || 'Required', v => /.+@.+/.test(v) || 'Invalid email']">
            <template #prepend><q-icon name="email" /></template>
          </q-input>
          <q-input v-model="form.phone" label="Phone (10 digits)" type="tel" outlined dense
            :rules="[v => !!v || 'Required', v => /^\d{10}$/.test(v) || '10 digits required']">
            <template #prepend><q-icon name="phone" /></template>
          </q-input>
          <q-input v-model="form.password" label="Password" :type="showPwd ? 'text' : 'password'"
            hint="At least 8 characters, with a letter and a number"
            outlined dense :rules="[
              v => !!v || 'Required',
              v => v.length >= 8 || 'At least 8 characters',
              v => /(?=.*[A-Za-z])(?=.*\d)/.test(v) || 'Include a letter and a number',
            ]">
            <template #prepend><q-icon name="lock" /></template>
            <template #append>
              <q-icon :name="showPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="showPwd = !showPwd" />
            </template>
          </q-input>
          <q-btn type="submit" label="Register" color="primary" unelevated class="full-width"
            style="height:52px;border-radius:14px;font-weight:700" :loading="loading" />
        </q-form>

        <div class="text-center q-mt-md">
          <router-link to="/login" style="color:#1E2A6E">Already have an account? Login</router-link>
        </div>
    </div>
  </q-page>
</template>

<script setup>
import BlockPrintBand from 'src/components/BlockPrintBand.vue';
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { AuthApi } from 'src/api/auth.api';
import { useAuthStore } from 'src/stores/auth';

const $q = useQuasar();
const router = useRouter();
const auth = useAuthStore();
const loading = ref(false);
const showPwd = ref(false);
const form = reactive({ name: '', email: '', phone: '', password: '' });

async function register() {
  loading.value = true;
  try {
    const { data } = await AuthApi.register(form);
    auth.pendingUserId = data.userId;
    auth.lastOtp = data.otp ?? null;
    $q.notify({ type: 'positive', message: data.otp ? `Email unavailable — your OTP is ${data.otp}` : 'Account created! Check your email for OTP.', timeout: data.otp ? 0 : 4000, closeBtn: !!data.otp });
    router.push({ path: '/verify-otp', query: { mode: 'register' } });
  } catch (err) {
    $q.notify({ type: 'negative', message: err.response?.data?.error ?? 'Registration failed' });
  } finally {
    loading.value = false;
  }
}
</script>
