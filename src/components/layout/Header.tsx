import React, { useState } from 'react';
import {
  GraduationCap,
  Bell,
  Menu,
  X,
  UserCheck,
  LogOut,
  ChevronDown,
  Shield,
  BookOpen,
  User as UserIcon,
  CheckCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SIAADataService } from '../../services/siaaService';
import { UserRole } from '../../types/siaa';
import { ThemeToggleButton } from '../common/ThemeToggleButton';

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onNavigateToNotifications?: () => void;
  onSelectAdvisory?: (id: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  isSidebarOpen,
  onNavigateToNotifications,
  onSelectAdvisory
}) => {
  const { currentUser, logout, switchUser } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const notifications = currentUser ? SIAADataService.getNotifications(currentUser.uid) : [];
  const unreadCount = notifications.filter(n => !n.leida).length;

  const demoAccounts: { name: string; roleName: string; role: UserRole; uid: string; email: string }[] = [
    {
      name: 'Mtro. Carlos Mendoza',
      roleName: 'Administrador General',
      role: 'admin',
      uid: 'user-admin-1',
      email: 'admin@siaa.edu.mx'
    },
    {
      name: 'Dra. Patricia Valenzuela',
      roleName: 'Directora Académica',
      role: 'director',
      uid: 'user-dir-1',
      email: 'directora.academica@siaa.edu.mx'
    },
    {
      name: 'Dr. Fernando Aguirre',
      roleName: 'Docente Asesor (Cálculo)',
      role: 'docente',
      uid: 'user-doc-1',
      email: 'fernando.aguirre@siaa.edu.mx'
    },
    {
      name: 'Mtra. Lorena Méndez',
      roleName: 'Docente Asesora (Sistemas)',
      role: 'docente',
      uid: 'user-doc-2',
      email: 'lorena.mendez@siaa.edu.mx'
    },
    {
      name: 'Mateo Ramírez (Alumno)',
      roleName: 'Alumno ITIDS (3° Cuat.)',
      role: 'alumno',
      uid: 'user-alu-3',
      email: 'mateo.ramirez@alumno.siaa.edu.mx'
    },
    {
      name: 'Mariana Ortiz (Alumna)',
      roleName: 'Alumna IIGP (1° Cuat.)',
      role: 'alumno',
      uid: 'user-alu-6',
      email: 'mariana.ortiz@alumno.siaa.edu.mx'
    }
  ];

  const roleLabelMap: Record<UserRole, { title: string; color: string }> = {
    admin: { title: 'Administrador', color: 'bg-amber-500/20 text-amber-300 border-amber-400/40' },
    director: { title: 'Directivo Académico', color: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40' },
    docente: { title: 'Docente Asesor', color: 'bg-sky-500/20 text-sky-200 border-sky-400/40' },
    alumno: { title: 'Alumno', color: 'bg-slate-500/20 text-slate-200 border-slate-400/40' }
  };

  const handleMarkAllRead = () => {
    if (currentUser) {
      SIAADataService.markAllNotificationsAsRead(currentUser.uid);
      setShowNotifMenu(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-emerald-900 dark:bg-emerald-950 border-b-2 border-amber-500 shadow-md text-white transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand / Logo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleSidebar}
              className="p-2 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800/80 focus:outline-hidden lg:hidden transition-colors"
              aria-label="Abrir menú"
            >
              {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-white/10 border border-amber-400/40 flex items-center justify-center shadow-inner shrink-0">
                <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400" />
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl font-bold tracking-tight text-white font-serif">
                    SIAA
                  </span>
                  <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-amber-500 text-emerald-950">
                    Institucional
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-emerald-200/90 font-medium hidden xs:block">
                  Sistema Integral de Asesorías Académicas
                </p>
              </div>
            </div>
          </div>

          {/* Right Toolbar */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Quick Demo Role Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-800/90 hover:bg-emerald-700 border border-emerald-600/60 text-xs sm:text-sm font-medium text-emerald-100 transition-colors shadow-xs"
                title="Cambiar rol para pruebas rápidas"
              >
                <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="hidden md:inline">Simular Rol:</span>
                <span className="font-semibold text-white">
                  {currentUser ? roleLabelMap[currentUser.rol].title : 'Seleccionar'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-emerald-300" />
              </button>

              {showRoleMenu && (
                <div
                  className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-2 text-slate-800 dark:text-slate-100 z-50 animate-fadeIn"
                  onClick={() => setShowRoleMenu(false)}
                >
                  <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/70">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Cambio Rápido de Cuenta para Pruebas
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Explora el sistema con cualquiera de los 4 roles
                    </p>
                  </div>
                  <div className="py-1 max-h-72 overflow-y-auto">
                    {demoAccounts.map(demo => (
                      <button
                        key={demo.uid}
                        type="button"
                        onClick={() => switchUser(demo.uid)}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-emerald-50 dark:hover:bg-emerald-950/60 flex items-start gap-2.5 transition-colors ${
                          currentUser?.uid === demo.uid
                            ? 'bg-emerald-50/80 dark:bg-emerald-950/70 font-semibold text-emerald-900 dark:text-emerald-300'
                            : 'text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-900/70 text-emerald-800 dark:text-emerald-300 mt-0.5 shrink-0">
                          {demo.role === 'admin' && <Shield className="w-3.5 h-3.5" />}
                          {demo.role === 'director' && <GraduationCap className="w-3.5 h-3.5" />}
                          {demo.role === 'docente' && <BookOpen className="w-3.5 h-3.5" />}
                          {demo.role === 'alumno' && <UserIcon className="w-3.5 h-3.5" />}
                        </div>
                        <div className="truncate">
                          <p className="font-semibold truncate">{demo.name}</p>
                          <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">{demo.roleName}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{demo.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Light / Dark Theme Toggle */}
            <ThemeToggleButton variant="header" />

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative p-2 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800/80 transition-colors"
                title="Notificaciones"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-amber-500 text-emerald-950 text-[10px] font-bold flex items-center justify-center ring-2 ring-emerald-900">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-2 text-slate-800 dark:text-slate-100 z-50 animate-fadeIn">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Notificaciones</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{unreadCount} no leídas</p>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-medium flex items-center gap-1"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Marcar todas leídas
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                        No hay notificaciones para mostrar
                      </div>
                    ) : (
                      notifications.slice(0, 6).map(notif => (
                        <div
                          key={notif.id}
                          className={`p-3 text-xs transition-colors cursor-pointer ${
                            !notif.leida
                              ? 'bg-emerald-50/60 dark:bg-emerald-950/50 font-medium'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                          }`}
                          onClick={() => {
                            SIAADataService.markNotificationAsRead(notif.id);
                            if (notif.referenciaId && onSelectAdvisory) {
                              onSelectAdvisory(notif.referenciaId);
                            }
                            setShowNotifMenu(false);
                          }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-emerald-900 dark:text-emerald-300">{notif.titulo}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">{notif.fechaCreacion.split(' ')[0]}</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 line-clamp-2">{notif.mensaje}</p>
                        </div>
                      ))
                    )}
                  </div>
                  {onNavigateToNotifications && (
                    <div className="px-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setShowNotifMenu(false);
                          onNavigateToNotifications();
                        }}
                        className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline font-semibold"
                      >
                        Ver todas las notificaciones
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Current User Info & Logout */}
            {currentUser && (
              <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-emerald-800">
                <div className="hidden sm:block text-right">
                  <p className="text-xs sm:text-sm font-semibold text-white leading-tight truncate max-w-[150px]">
                    {currentUser.nombre} {currentUser.apellidoPaterno}
                  </p>
                  <span className={`inline-block text-[10px] px-1.5 py-0.2 rounded border font-medium mt-0.5 ${roleLabelMap[currentUser.rol].color}`}>
                    {roleLabelMap[currentUser.rol].title}
                  </span>
                </div>

                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-amber-500 text-emerald-950 font-bold flex items-center justify-center text-xs shadow-inner shrink-0">
                  {currentUser.nombre.charAt(0)}{currentUser.apellidoPaterno.charAt(0)}
                </div>

                <button
                  type="button"
                  onClick={logout}
                  className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800/80 transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
