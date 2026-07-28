import { useAttendanceStore } from 'src/stores/attendance.store';
import { AttendanceApi } from 'src/api/attendance.api';
import { useQuasar } from 'quasar';

/**
 * Encapsulates the punch-in / punch-out flow used by DashboardPage.
 * Keeps all API + store interaction out of the component.
 */
export function useAttendance() {
  const store = useAttendanceStore();
  const $q    = useQuasar();

  async function punch(type, { lat, lng, snapshot }) {
    $q.loading.show({ message: `Recording punch ${type}…` });
    try {
      const blob     = await (await fetch(snapshot)).blob();
      const formData = new FormData();
      formData.append('lat',   lat);
      formData.append('lng',   lng);
      formData.append('photo', blob, 'punch.jpg');

      const { data } = type === 'in'
        ? await AttendanceApi.punchIn(formData)
        : await AttendanceApi.punchOut(formData);

      $q.notify({ type: 'positive', message: data.message + (data.shift ? ` — Shift: ${data.shift}` : '') });
      await store.fetchToday();
      return { success: true, data };
    } catch (err) {
      const msg = err.response?.data?.error ?? `Punch ${type} failed`;
      $q.notify({ type: 'negative', message: msg });
      return { success: false, error: msg, outsideGeofence: err.response?.status === 403 };
    } finally {
      $q.loading.hide();
    }
  }

  return { punch };
}
