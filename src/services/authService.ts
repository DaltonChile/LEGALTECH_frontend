import api from './api';

interface User {
  id: string;
  email: string;
  role: string;
  full_name: string;
}

interface LoginResponse {
  success: boolean;
  data: User;
  message: string;
}

export const authService = {
  // Login - el backend setea la cookie httpOnly "token"
  login: async (credentials: { email: string; password: string }): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  // Obtener usuario actual desde el backend (fuente de verdad)
  me: async (): Promise<User> => {
    const response = await api.get<{ success: boolean; data: User }>('/auth/me');
    return response.data.data;
  },

  // Logout - pedir al backend borrar la cookie
  logout: async () => {
    await api.post('/auth/logout');
  },
};