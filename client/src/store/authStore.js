import { create } from 'zustand';
import { authAPI } from '../services/api';

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: async () => {
    const token = localStorage.getItem('dk_token');
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const res = await authAPI.getMe();
      const { user, customer, role } = res.data.data;
      set({
        user: user || customer,
        token,
        role,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      localStorage.removeItem('dk_token');
      localStorage.removeItem('dk_user');
      set({ isLoading: false });
    }
  },

  loginOwner: async (credentials) => {
    const res = await authAPI.loginOwner(credentials);
    const { token, user } = res.data.data;
    localStorage.setItem('dk_token', token);
    set({ user, token, role: 'owner', isAuthenticated: true });
    return { role: 'owner' };
  },

  loginEmployee: async (credentials) => {
    const res = await authAPI.loginEmployee(credentials);
    const { token, user } = res.data.data;
    localStorage.setItem('dk_token', token);
    set({ user, token, role: 'employee', isAuthenticated: true });
    return { role: 'employee' };
  },

  loginCustomer: async (credentials) => {
    const res = await authAPI.loginCustomer(credentials);
    const { token, customer } = res.data.data;
    localStorage.setItem('dk_token', token);
    set({ user: customer, token, role: 'customer', isAuthenticated: true });
    return { role: 'customer', customerId: customer._id };
  },

  logout: () => {
    localStorage.removeItem('dk_token');
    localStorage.removeItem('dk_user');
    set({ user: null, token: null, role: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
