<template>
  <svg class="block-print-band" width="100%" height="22" viewBox="0 0 390 22" preserveAspectRatio="xMidYMid slice">
    <defs>
      <pattern :id="pid" width="34" height="22" patternUnits="userSpaceOnUse">
        <g fill="none" :stroke="stroke" stroke-width="1.2" opacity=".75">
          <path d="M17 3 L24 11 L17 19 L10 11 Z" />
          <path d="M1 11 H7 M27 11 H33" />
        </g>
        <circle cx="17" cy="11" r="2" fill="#f4a300" />
        <circle v-if="!dark" cx="3" cy="11" r="1.3" fill="#1e2a6e" opacity=".6" />
      </pattern>
    </defs>
    <rect width="390" height="22" :fill="`url(#${pid})`" />
  </svg>
</template>

<script setup>
import { computed } from 'vue';
const props = defineProps({ dark: { type: Boolean, default: false } });
const pid = `bp-${Math.random().toString(36).slice(2, 8)}`;
const stroke = computed(() => (props.dark ? '#f4a300' : '#1e2a6e'));
</script>

<style scoped>
.block-print-band { display: block; }
</style>
