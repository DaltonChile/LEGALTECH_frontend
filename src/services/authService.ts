import api from './api';

interface LoginCredentials {
  email: string;
  password: string;
}

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
  // Login - La cookie se establece automáticamente
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    
    // Guardar solo datos de usuario en localStorage (no el token)
    if (response.data.success) {
      localStorage.setItem('user', JSON.stringify(response.data.data));
    }
    
    return response.data;
  },

  // Logout - Limpiar cookie y localStorage
  logout: async () => {
    try {
      // Opcionalmente, llama a un endpoint de logout en el backend
      // await api.post('/auth/logout');
      localStorage.removeItem('user');
      // La cookie se puede borrar desde el backend o expirará sola
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      localStorage.removeItem('user');
    }
  },

  // Obtener usuario actual (de localStorage, no de cookie)
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Verificar si está autenticado
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('user');
  },
};