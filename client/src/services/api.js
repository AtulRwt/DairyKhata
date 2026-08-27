import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dk_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle auth errors globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('dk_token');
      localStorage.removeItem('dk_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ---- Auth ----
export const authAPI = {
  registerOwner: (data) => api.post('/auth/owner/register', data),
  loginOwner: (data) => api.post('/auth/owner/login', data),
  loginEmployee: (data) => api.post('/auth/employee/login', data),
  loginCustomer: (data) => api.post('/auth/customer/login', data),
  getMe: () => api.get('/auth/me'),
};

// ---- Dashboard ----
export const dashboardAPI = {
  getStats: () => api.get('/dashboard'),
  getAuditLog: (params) => api.get('/dashboard/audit', { params }),
};

// ---- Customers ----
export const customersAPI = {
  getAll: (params) => api.get('/customers', { params }),
  create: (data) => api.post('/customers', data),
  getById: (id) => api.get(`/customers/${id}`),
  update: (id, data) => api.put(`/customers/${id}`, data),
  updateStatus: (id, active) => api.patch(`/customers/${id}/status`, { active }),
  delete: (id) => api.delete(`/customers/${id}`),
};

// ---- Milk ----
export const milkAPI = {
  getMonthly: (params) => api.get('/milk/monthly', { params }),
  upsert: (data) => api.post('/milk', data),
  delete: (id) => api.delete(`/milk/${id}`),
};

// ---- Billing ----
export const billingAPI = {
  getCustomerBilling: (customerId, params) =>
    api.get(`/billing/customer/${customerId}`, { params }),
  getMonthlyBilling: (params) => api.get('/billing/monthly', { params }),
};

// ---- Employees ----
export const employeesAPI = {
  getAll: () => api.get('/employees'),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
};

// ---- Windows ----
export const windowsAPI = {
  getAll: () => api.get('/windows'),
  create: (data) => api.post('/windows', data),
  update: (id, data) => api.put(`/windows/${id}`, data),
  delete: (id) => api.delete(`/windows/${id}`),
};

// ---- Settings ----
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
};

// ---- Payments ----
export const paymentsAPI = {
  getAll: (params) => api.get('/payments', { params }),
  create: (data) => api.post('/payments', data),
  updateStatus: (id, data) => api.patch(`/payments/${id}/status`, data),
};

export default api;
