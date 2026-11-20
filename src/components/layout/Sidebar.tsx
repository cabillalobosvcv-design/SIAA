import React from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Layers,
  CalendarDays,
  BookOpen,
  DoorOpen,
  Clock,
  FileQuestion,
  FileCheck2,
  Calendar,
  FileSpreadsheet,
  Settings,
  History,
  ClipboardList,
  UserCircle,
  PlusCircle,
  ShieldCheck,
  Upload
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/siaa';

export type NavView =
  | 'dashboard'
  | 'usuarios'
  | 'carreras'
  | 'grupos'
  | 'cuatrimestres'
  | 'materias'
  | 'aulas'
  | 'carga_masiva'
  | 'disponibilidad'
  | 'solicitar'
  | 'solicitudes'
  | 'asesorias'
  | 'calendario'
  | 'seguimiento'
  | 'historial'
  | 'reportes'
  | 'configuracion'
  | 'auditoria'
  | 'perfil';

interface SidebarProps {
  currentView: NavView;
  onNavigate: (view: NavView) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  id: NavView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
  badge?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isOpen,
  onClose
}) => {
  const { currentRole, currentUser } = useAuth();

  const navItems: NavItem[] = [
    // Dashboard (All)
    { id: 'dashboard', label: currentRole === 'alumno' ? 'Inicio' : 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'director', 'docente', 'alumno'] },
    
    // Alumno Direct Actions
    { id: 'solicitar', label: 'Solicitar Asesoría', icon: PlusCircle, roles: ['alumno'] },
    { id: 'solicitudes', label: currentRole === 'alumno' ? 'Mis Solicitudes' : 'Solicitudes', icon: FileQuestion, roles: ['admin', 'director', 'docente', 'alumno'] },
    { id: 'asesorias', label: currentRole === 'alumno' ? 'Mis Asesorías' : currentRole === 'docente' ? 'Mis Asesorías' : 'Asesorías', icon: FileCheck2, roles: ['admin', 'director', 'docente', 'alumno'] },
    
    // Calendar (All)
    { id: 'calendario', label: 'Calendario', icon: Calendar, roles: ['admin', 'director', 'docente', 'alumno'] },
    
    // Teacher & Specific
    { id: 'disponibilidad', label: currentRole === 'docente' ? 'Mi Disponibilidad' : 'Disponibilidad Docente', icon: Clock, roles: ['admin', 'docente'] },
    { id: 'seguimiento', label: 'Registro de Seguimiento', icon: ClipboardList, roles: ['docente'] },
    { id: 'historial', label: 'Historial de Asesorías', icon: History, roles: ['director', 'docente', 'alumno'] },

    // Admin Catalogs & Management
    { id: 'usuarios', label: 'Gestión de Usuarios', icon: Users, roles: ['admin'] },
    { id: 'carreras', label: 'Carreras', icon: GraduationCap, roles: ['admin'] },
    { id: 'grupos', label: 'Grupos', icon: Layers, roles: ['admin'] },
    { id: 'cuatrimestres', label: 'Cuatrimestres', icon: CalendarDays, roles: ['admin'] },
    { id: 'materias', label: 'Materias', icon: BookOpen, roles: ['admin'] },
    { id: 'aulas', label: 'Aulas y Espacios', icon: DoorOpen, roles: ['admin'] },
    { id: 'carga_masiva', label: 'Carga Masiva y Plantillas', icon: Upload, roles: ['admin'] },

    // Reports (Admin, Director)
    { id: 'reportes', label: 'Reportes y Estadísticas', icon: FileSpreadsheet, roles: ['admin', 'director'] },

    // Audit & Settings (Admin)
    { id: 'auditoria', label: 'Auditoría del Sistema', icon: ShieldCheck, roles: ['admin'] },
    { id: 'configuracion', label: 'Configuración', icon: Settings, roles: ['admin'] },

    // Profile (Alumno, Docente)
    { id: 'perfil', label: 'Mi Perfil', icon: UserCircle, roles: ['alumno', 'docente', 'director'] }
  ];

  const allowedItems = navItems.filter(
    item => currentRole && item.roles.includes(currentRole)
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 sm:top-20 bottom-0 left-0 z-30 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-xs flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Institutional Section Banner */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-400">
            Módulo Institucional
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-500"></span>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 capitalize">
              {currentRole === 'admin' && 'Administración Central'}
              {currentRole === 'director' && 'Dirección Académica'}
              {currentRole === 'docente' && 'Portal del Docente'}
              {currentRole === 'alumno' && 'Portal del Estudiante'}
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {allowedItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-emerald-900 dark:bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-900 dark:hover:text-emerald-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-amber-400' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Footer info in sidebar */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 text-[11px] text-slate-500 dark:text-slate-400">
          <p className="font-semibold text-slate-700 dark:text-slate-200 truncate">
            {currentUser?.nombre} {currentUser?.apellidoPaterno}
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
            {currentUser?.correo}
          </p>
          <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
            <span>SIAA v2.4</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Ciclo 2026-3</span>
          </div>
        </div>
      </aside>
    </>
  );
};
