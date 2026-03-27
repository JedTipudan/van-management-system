import api from './client';

export const auth = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  profile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.patch('/auth/profile', data),
  changePassword: (data) => api.patch('/auth/change-password', data),
};

export const vans = {
  getAll: (params) => api.get('/vans', { params }),
  getOne: (id) => api.get(`/vans/${id}`),
  create: (data) => api.post('/vans', data),
  update: (id, data) => api.put(`/vans/${id}`, data),
  remove: (id) => api.delete(`/vans/${id}`),
  addMaintenance: (id, data) => api.post(`/vans/${id}/maintenance`, data),
};

export const drivers = {
  getAll: (params) => api.get('/drivers', { params }),
  getOne: (id) => api.get(`/drivers/${id}`),
  create: (data) => api.post('/drivers', data),
  updateStatus: (id, status) => api.patch(`/drivers/${id}/status`, { status }),
  mySchedule: () => api.get('/drivers/my-schedule'),
  myVan: () => api.get('/drivers/my-van'),
};

export const routes = {
  getAll: () => api.get('/routes'),
  getOne: (id) => api.get(`/routes/${id}`),
  create: (data) => api.post('/routes', data),
  update: (id, data) => api.put(`/routes/${id}`, data),
  remove: (id) => api.delete(`/routes/${id}`),
};

export const schedules = {
  getAll: (params) => api.get('/schedules', { params }),
  create: (data) => api.post('/schedules', data),
  update: (id, data) => api.put(`/schedules/${id}`, data),
  remove: (id) => api.delete(`/schedules/${id}`),
};

export const trips = {
  getAll: (params) => api.get('/trips', { params }),
  start: (id) => api.patch(`/trips/${id}/start`),
  end: (id) => api.patch(`/trips/${id}/end`),
  passengers: (id, history = false) => api.get(`/trips/${id}/passengers`, { params: history ? { history: 'true' } : {} }),
  markPaid: (trip_id, booking_id, paid) => api.patch(`/trips/${trip_id}/passengers/${booking_id}/mark-paid`, { paid }),
  driverPerformance: () => api.get('/trips/driver-performance'),
};

export const bookings = {
  create: (data) => api.post('/bookings', data),
  my: () => api.get('/bookings/my'),
  seatMap: (trip_id) => api.get(`/bookings/seat-map/${trip_id}`),
  cancel: (id, reason) => api.patch(`/bookings/${id}/cancel`, { reason }),
  approveCancelRequest: (id) => api.patch(`/bookings/${id}/cancel-approve`),
  rejectCancelRequest: (id) => api.patch(`/bookings/${id}/cancel-reject`),
  updateLocation: (id, data) => api.patch(`/bookings/${id}/location`, data),
  confirmPayment: (id, data) => api.patch(`/bookings/${id}/payment`, data),
};

export const reports = {
  summary: () => api.get('/reports/summary'),
  revenue: (params) => api.get('/reports/revenue', { params }),
  trips: (params) => api.get('/reports/trips', { params }),
};

export const tracking = {
  getLocation: (van_id) => api.get(`/tracking/van/${van_id}`),
  update: (data) => api.post('/tracking', data),
};

export const driveRequests = {
  create: (data) => api.post('/drive-requests', data),
  my: () => api.get('/drive-requests/my'),
  cancel: (id) => api.patch(`/drive-requests/${id}/cancel`),
  getAll: (params) => api.get('/drive-requests', { params }),
  approve: (id, data) => api.patch(`/drive-requests/${id}/approve`, data),
  reject: (id, data) => api.patch(`/drive-requests/${id}/reject`, data),
};
