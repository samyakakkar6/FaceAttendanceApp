import { boot } from 'quasar/wrappers';
import apiClient from 'src/api/client';

// Make the API client accessible as this.$api in Options API components.
// Composition API components import directly from src/api/*.
export default boot(({ app }) => {
  app.config.globalProperties.$api = apiClient;
});

export { apiClient as api };
