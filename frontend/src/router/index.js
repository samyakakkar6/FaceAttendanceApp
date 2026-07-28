import { route } from 'quasar/wrappers';
import { createRouter, createMemoryHistory, createWebHistory, createWebHashHistory } from 'vue-router';
import routes from './routes';

export default route(function () {
  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: process.env.SERVER
      ? createMemoryHistory(process.env.VUE_ROUTER_BASE)
      : process.env.VUE_ROUTER_MODE === 'history'
        ? createWebHistory(process.env.VUE_ROUTER_BASE)
        : createWebHashHistory(process.env.VUE_ROUTER_BASE),
  });

  Router.beforeEach(async to => {
    // Lazy-import so Pinia is initialised before the guard runs
    const { useAuthStore } = await import('src/stores/auth');
    const auth = useAuthStore();

    if (to.meta.requiresAuth && !auth.isLoggedIn) return '/login';
    if (to.meta.requiresAdmin && !auth.isAdmin)   return '/dashboard';
    if (to.meta.guest && auth.isLoggedIn)          return auth.isAdmin ? '/admin' : '/dashboard';
  });

  return Router;
});
