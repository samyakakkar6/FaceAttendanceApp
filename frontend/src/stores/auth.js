import { defineStore } from 'pinia';
import { LocalStorage } from 'quasar';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: LocalStorage.getItem('token') ?? null,
    user: LocalStorage.getItem('user') ?? null,
    pendingUserId: null,
    lastOtp: null,
  }),

  getters: {
    isLoggedIn: s => !!s.token,
    isAdmin: s => s.user?.role === 'admin',
    hasFace: s => !!s.user?.face_descriptor,
  },

  actions: {
    setToken(token) {
      this.token = token;
      LocalStorage.set('token', token);
    },
    setUser(user) {
      this.user = user;
      LocalStorage.set('user', user);
    },
    logout() {
      this.token = null;
      this.user = null;
      LocalStorage.remove('token');
      LocalStorage.remove('user');
    },
    updateFaceDescriptor(descriptor) {
      if (this.user) {
        this.user = { ...this.user, face_descriptor: descriptor };
        LocalStorage.set('user', this.user);
      }
    },
  },
});
