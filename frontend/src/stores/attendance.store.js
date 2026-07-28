import { defineStore } from 'pinia';
import { AttendanceApi } from 'src/api/attendance.api';

export const useAttendanceStore = defineStore('attendance', {
  state: () => ({
    today:   null,
    history: [],
    loading: false,
  }),

  getters: {
    isPunchedIn:  s => !!s.today?.punch_in,
    isPunchedOut: s => !!s.today?.punch_out,

    shiftDuration(s) {
      if (!s.today?.punch_in || !s.today?.punch_out) return null;
      const ms = new Date(s.today.punch_out) - new Date(s.today.punch_in);
      if (ms < 60_000) return 'Not completed';
      const h  = Math.floor(ms / 3_600_000);
      const m  = Math.floor((ms % 3_600_000) / 60_000);
      const sec = Math.floor((ms % 60_000) / 1_000);
      return `${h}h ${m}m ${sec}s`;
    },
  },

  actions: {
    async fetchToday() {
      const { data } = await AttendanceApi.getToday();
      this.today = data;
    },

    async fetchHistory() {
      this.loading = true;
      try {
        const { data } = await AttendanceApi.getHistory();
        this.history = data;
      } finally {
        this.loading = false;
      }
    },
  },
});
