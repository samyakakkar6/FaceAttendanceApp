<template>
  <q-page class="kolam-light column flex-center q-pb-lg" style="min-height:100vh">
    <BlockPrintBand class="absolute-top" />

    <div class="column items-center q-mt-xl" style="text-align:center">
      <svg width="58" height="58" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="5" fill="#f4a300" />
        <g stroke="#f4a300" stroke-width="1.8" stroke-linecap="round" fill="none">
          <path d="M12 2v2.5M12 19.5v2.5M2 12h2.5M19.5 12h2.5M4.8 4.8l1.8 1.8M17.4 17.4l1.8 1.8M19.2 4.8l-1.8 1.8M6.6 17.4l-1.8 1.8" />
        </g>
      </svg>
      <div class="brandname q-mt-sm" style="font-size:25px;color:#1E2A6E">Dekho Mai Aagya!</div>
      <div style="font-size:14px;margin-top:6px;color:#8A7D66">Facial attendance, geofenced and secure</div>
    </div>

    <div class="dmag-card q-mt-lg q-pa-lg" style="width:340px;max-width:92vw">
      <div class="disp" style="font-size:22px;color:#1E2A6E">Sign in to punch in</div>
      <div style="font-size:14px;color:#8A7D66;margin-top:4px">Use your work email and password.</div>

      <q-form @submit.prevent="login" class="q-gutter-md q-mt-md">
        <div>
          <div class="lab">Work email</div>
          <q-input v-model="form.email" type="email" outlined dense
            :rules="[v => !!v || 'Required', v => /.+@.+/.test(v) || 'Enter a valid work email']" />
        </div>
        <div>
          <div class="lab">Password</div>
          <q-input v-model="form.password" :type="showPwd ? 'text' : 'password'"
            outlined dense :rules="[v => !!v || 'Required']">
            <template #append>
              <q-icon :name="showPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="showPwd = !showPwd" />
            </template>
          </q-input>
        </div>
        <q-btn type="submit" label="Sign in" color="primary" unelevated class="full-width"
          style="height:52px;border-radius:14px;font-weight:700" :loading="loading" />
      </q-form>

      <div class="text-center q-mt-md q-gutter-y-xs">
        <router-link to="/forgot-password" class="block" style="color:#1E2A6E;font-weight:700">Forgot password?</router-link>
        <router-link to="/register" class="block" style="color:#1E2A6E">Don't have an account? Register</router-link>
      </div>
    </div>

    <div class="trust-line q-mt-lg">
      <q-icon name="shield" color="positive" size="16px" />Secured on device · no passwords to remember
    </div>
  </q-page>
</template>

<script setup>
import { ref, reactive } from 'vue';
import BlockPrintBand from 'src/components/BlockPrintBand.vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { AuthApi } from 'src/api/auth.api';
import { useAuthStore } from 'src/stores/auth';

const $q = useQuasar();
const router = useRouter();
const auth = useAuthStore();
const loading = ref(false);
const showPwd = ref(false);
const form = reactive({ email: '', password: '' });

async function login() {
  loading.value = true;
  try {
    const { data } = await AuthApi.login(form);
    auth.setToken(data.token);
    auth.setUser(data.user);
    router.replace(data.user.face_descriptor ? (auth.isAdmin ? '/admin' : '/dashboard') : '/face-setup');
  } catch (err) {
    const status = err.response?.status;
    const msg = err.response?.data?.error ?? 'Login failed';
    if (status === 403) {
      auth.pendingUserId = err.response.data.userId;
      router.push({ path: '/verify-otp', query: { mode: 'verify' } });
    } else {
      $q.notify({ type: 'negative', message: msg });
    }
  } finally {
    loading.value = false;
  }
}
</script>
