import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/siaa';
import { SIAADataService } from '../services/siaaService';

interface AuthContextType {
  currentUser: User | null;
  currentRole: UserRole | null;
  loading: boolean;
  login: (correo: string, contrasenia: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchUser: (uid: string) => void;
  resetPassword: (correo: string) => Promise<{ success: boolean; message: string }>;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_KEY = 'siaa_current_auth_uid';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = () => {
    const users = SIAADataService.getUsers();
    const savedUid = localStorage.getItem(AUTH_USER_KEY);
    if (savedUid) {
      const user = users.find(u => u.uid === savedUid);
      if (user && user.estado === 'activo') {
        setCurrentUser(user);
        return;
      }
    }
    // Default to admin for initial preview convenience if none logged in
    const defaultAdmin = users.find(u => u.rol === 'admin' && u.estado === 'activo');
    if (defaultAdmin) {
      setCurrentUser(defaultAdmin);
      localStorage.setItem(AUTH_USER_KEY, defaultAdmin.uid);
    }
  };

  useEffect(() => {
    refreshUser();
    setLoading(false);

    const handleUsersUpdated = () => {
      const savedUid = localStorage.getItem(AUTH_USER_KEY);
      if (!savedUid) return;
      const users = SIAADataService.getUsers();
      const updated = users.find(u => u.uid === savedUid);
      if (updated) {
        setCurrentUser(updated);
      }
    };

    window.addEventListener('siaa-users-updated', handleUsersUpdated);
    return () => window.removeEventListener('siaa-users-updated', handleUsersUpdated);
  }, []);

  const login = async (correo: string, _contrasenia: string): Promise<{ success: boolean; error?: string }> => {
    const users = SIAADataService.getUsers();
    const cleanEmail = correo.trim().toLowerCase();
    const user = users.find(u => u.correo.toLowerCase() === cleanEmail);

    if (!user) {
      return { success: false, error: 'Usuario no encontrado con ese correo institucional.' };
    }

    if (user.estado !== 'activo') {
      return { success: false, error: 'La cuenta de usuario se encuentra inactiva. Contacte a la administración.' };
    }

    setCurrentUser(user);
    localStorage.setItem(AUTH_USER_KEY, user.uid);

    SIAADataService.logAudit({
      usuarioId: user.uid,
      usuarioNombre: `${user.nombre} ${user.apellidoPaterno}`,
      rol: user.rol,
      accion: 'INICIO_SESION',
      modulo: 'Autenticación',
      documentoAfectado: user.correo,
      detalles: 'Inicio de sesión exitoso al portal SIAA'
    });

    return { success: true };
  };

  const logout = () => {
    if (currentUser) {
      SIAADataService.logAudit({
        usuarioId: currentUser.uid,
        usuarioNombre: `${currentUser.nombre} ${currentUser.apellidoPaterno}`,
        rol: currentUser.rol,
        accion: 'CIERRE_SESION',
        modulo: 'Autenticación',
        documentoAfectado: currentUser.correo,
        detalles: 'Cierre de sesión de usuario'
      });
    }
    setCurrentUser(null);
    localStorage.removeItem(AUTH_USER_KEY);
  };

  const switchUser = (uid: string) => {
    const users = SIAADataService.getUsers();
    const target = users.find(u => u.uid === uid);
    if (target) {
      setCurrentUser(target);
      localStorage.setItem(AUTH_USER_KEY, target.uid);
    }
  };

  const resetPassword = async (correo: string): Promise<{ success: boolean; message: string }> => {
    const users = SIAADataService.getUsers();
    const exists = users.some(u => u.correo.toLowerCase() === correo.trim().toLowerCase());
    if (!exists) {
      return { success: false, message: 'No se encontró ninguna cuenta asociada a este correo electrónico.' };
    }
    return {
      success: true,
      message: `Se ha enviado un enlace de restablecimiento al correo institucional: ${correo}. Verifique su bandeja de entrada.`
    };
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole: currentUser ? currentUser.rol : null,
        loading,
        login,
        logout,
        switchUser,
        resetPassword,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
