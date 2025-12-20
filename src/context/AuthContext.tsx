import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/authService';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'notario';
  full_name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isNotario: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar usuario al iniciar (desde backend, usando cookie)
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const currentUser = await authService.me();
        if (mounted) {
          setUser(currentUser as User);
        }
      } catch {
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const response = await authService.login({ email, password });
    const nextUser = response.data as User;
    setUser(nextUser);
    return nextUser;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isNotario: user?.role === 'notario',
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook personalizado para usar el contexto
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}