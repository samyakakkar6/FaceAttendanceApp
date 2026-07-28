const routes = [
  {
    path: '/',
    component: () => import('layouts/AuthLayout.vue'),
    children: [
      { path: '', redirect: '/login' },
      { path: 'login',       component: () => import('pages/LoginPage.vue'),      meta: { guest: true } },
      { path: 'register',    component: () => import('pages/RegisterPage.vue'),   meta: { guest: true } },
      { path: 'verify-otp',  component: () => import('pages/OtpPage.vue') },
      { path: 'forgot-password', component: () => import('pages/ForgotPasswordPage.vue'), meta: { guest: true } },
      { path: 'face-setup',  component: () => import('pages/FaceSetupPage.vue'),  meta: { requiresAuth: true } },
    ],
  },
  {
    path: '/dashboard',
    component: () => import('layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', component: () => import('pages/DashboardPage.vue') },
      { path: 'history',  component: () => import('pages/HistoryPage.vue') },
      { path: 'profile',  component: () => import('pages/ProfilePage.vue') },
    ],
  },
  {
    path: '/admin',
    component: () => import('layouts/AppLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      { path: '',            component: () => import('pages/admin/AdminDashboard.vue') },
      { path: 'employees',   component: () => import('pages/admin/EmployeesPage.vue') },
      { path: 'attendance',  component: () => import('pages/admin/AttendancePage.vue') },
      { path: 'record/:id',  component: () => import('pages/admin/RecordDetailPage.vue') },
    ],
  },
  { path: '/:catchAll(.*)*', component: () => import('pages/ErrorNotFound.vue') },
];

export default routes;
