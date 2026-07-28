import client from './client';

export const FaceApi = {
  register: formData => client.post('/face/register', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getStoredDescriptor: () => client.post('/face/verify', {}),
};
