<template>
  <q-page class="kolam-light column flex-center" style="min-height:100vh">
    <BlockPrintBand class="absolute-top" />

    <div class="dmag-card q-pa-lg" style="width:340px;max-width:92vw">
      <div class="text-center">
        <q-icon name="verified_user" size="40px" color="primary" />
        <div class="disp q-mt-sm" style="font-size:25px;color:#1E2A6E">Enter the code</div>
        <div style="font-size:14px;color:#8A7D66;margin-top:4px">We sent a 6-digit code to your email.</div>
      </div>

      <q-input
        ref="otpInput"
        v-model="otp"
        mask="######"
        unmasked-value
        inputmode="numeric"
        outlined
        class="q-my-lg"
        input-style="text-align:center;font-size:1.8rem;font-weight:bold;letter-spacing:0.5rem;color:#1E2A6E"
        placeholder="------"
        @keyup.enter="verify"
      />

      <q-btn label="Verify & continue" color="primary" unelevated class="full-width q-mb-sm"
        style="height:52px;border-radius:14px;font-weight:700" :loading="loading" @click="verify" />
      <q-btn label="Resend OTP" flat color="primary" class="full-width"
        :loading="resending" :disable="countdown > 0" @click="resend" />
      <div class="text-center text-caption q-mt-xs" style="color:#A08C66">
        {{ countdown > 0 ? `Resend in ${countdown}s` : 'You can resend now' }}
      </div>
    </div>

    <div class="trust-line q-mt-lg">
      <q-icon name="shield" color="positive" size="14px" />Code expires in 10 minutes · single use
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import BlockPrintBand from 'src/components/BlockPrintBand.vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { AuthApi } from 'src/api/auth.api';
import { useAuthStore } from 'src/stores/auth';

const $q     = useQuasar();
const router = useRouter();
const auth   = useAuthStore();

const otp      = ref('');
const otpInput = ref(null);
const loading  = ref(false);
const resending = ref(false);
const countdown = ref(60);
let timer = null;

onMounted(() => {
  if (auth.lastOtp) { otp.value = auth.lastOtp; auth.lastOtp = null; }
  otpInput.value?.focus();
  timer = setInterval(() => { if (countdown.value > 0) countdown.value--; }, 1000);
});
onUnmounted(() => clearInterval(timer));

async function verify() {
  if (otp.value.length !== 6) return $q.notify({ type: 'warning', message: 'Enter all 6 digits' });
  loading.value = true;
  try {
    const { data } = await AuthApi.verifyOtp({ userId: auth.pendingUserId, otp: otp.value });
    auth.setToken(data.token);
    auth.setUser(data.user);
    $q.notify({ type: 'positive', message: 'Verified successfully!' });
    router.replace(data.user.face_descriptor ? (auth.isAdmin ? '/admin' : '/dashboard') : '/face-setup');
  } catch (err) {
    $q.notify({ type: 'negative', message: err.response?.data?.error ?? 'Invalid OTP' });
    otp.value = '';
    otpInput.value?.focus();
  } finally {
    loading.value = false;
  }
}

async function resend() {
  if (countdown.value > 0) return;
  resending.value = true;
  try {
    const { data } = await AuthApi.resendOtp({ userId: auth.pendingUserId });
    countdown.value = 60;
    if (data.otp) {
      otp.value = data.otp;
      $q.notify({ type: 'positive', message: `Email unavailable — your OTP is ${data.otp}`, timeout: 0, closeBtn: true });
    } else {
      $q.notify({ type: 'positive', message: 'OTP resent to your email' });
    }
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to resend OTP' });
  } finally {
    resending.value = false;
  }
}
</script>
