import client from './client';

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

export const AdminApi = {
  getStats:      (date)     => client.get('/admin/stats', { params: { date } }),
  getAttendance: (date)     => client.get('/admin/attendance', { params: { date } }),
  getRecord:     (id)       => client.get(`/admin/attendance/${id}`),
  getEmployees:  ()         => client.get('/admin/employees'),
  deleteEmployee:(id)       => client.delete(`/admin/employees/${id}`),
  getGeofence:   ()         => client.get('/admin/geofence'),
  photoUrl:      (filename) => `${BASE_URL}/api/v1/admin/photo/${filename}`,
};
