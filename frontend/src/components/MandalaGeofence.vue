<template>
  <svg :width="size" :height="size" viewBox="0 0 80 80">
    <g fill="none" :stroke="inside ? '#1e2a6e' : '#c0392b'" stroke-width="1.1" opacity=".55">
      <path v-for="r in petals" :key="r" d="M40 9 C44 18 44 22 40 27 C36 22 36 18 40 9 Z" :transform="`rotate(${r} 40 40)`" />
    </g>
    <circle cx="40" cy="40" r="22" fill="none" :stroke="inside ? '#f4a300' : '#c0392b'" stroke-width="1.4" stroke-dasharray="1 5" stroke-linecap="round" />
    <circle cx="40" cy="40" r="13" fill="none" :stroke="inside ? '#1e2a6e' : '#c0392b'" stroke-width="1" opacity=".4" />
    <circle cx="40" cy="40" r="5" :fill="inside ? '#2f7d4f' : '#c0392b'" />
  </svg>
</template>

<script setup>
defineProps({ inside: { type: Boolean, default: true }, size: { type: Number, default: 72 } });
const petals = [0, 45, 90, 135, 180, 225, 270, 315];
</script>
