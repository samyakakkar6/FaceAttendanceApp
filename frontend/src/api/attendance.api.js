import client from './client';

export const AttendanceApi = {
  punchIn:    formData => client.post('/attendance/punch-in',  formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  punchOut:   formData => client.post('/attendance/punch-out', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getToday:   ()       => client.get('/attendance/today'),
  getHistory: ()       => client.get('/attendance/my'),
};
