import React, { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  BookOpen,
  ArrowRight,
  PlusCircle,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  Sparkles,
  UserCheck,
  ClipboardList
} from 'lucide-react';
import { NavView } from '../layout/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useRealtimeNotifications } from '../../hooks/useRealtimeNotifications';
import { SIAADataService } from '../../services/siaaService';
import { StatusBadge, PriorityBadge } from '../common/StatusBadge';
import { WidgetNotificationBadge } from './WidgetNotificationBadge';
import { LiveNotificationsBanner } from './LiveNotificationsBanner';
import {
  ROLE_HIERARCHY,
  getRoleMeta,
  isTeachingRole,
  canCreateSolicitudForStudents,
  getUserCarreraIds,
  userMatchesCareerScope
} from '../../utils/roles';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export interface NavigationFilterOptions {
  estado?: string;
  fecha?: string;
  carreraId?: string;
}

interface DashboardViewProps {
  onNavigate: (view: NavView, options?: NavigationFilterOptions) => void;
  onSelectAdvisory: (id: string) => void;
  onOpenSolicitudModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onSelectAdvisory,
  onOpenSolicitudModal
}) => {
  const { currentUser, currentRole } = useAuth();
  const { isDark } = useTheme();
  const {
    syncTick,
    unreadNotifications,
    getUnreadForWidget,
    markRead,
    markIdsRead,
    markAllRead
  } = useRealtimeNotifications(currentUser?.uid);
  void syncTick;
  const asesorias = SIAADataService.getAsesorias();
  const users = SIAADataService.getUsers();
  const materias = SIAADataService.getMaterias();
  const carreras = SIAADataService.getCarreras();
  const aulas = SIAADataService.getAulas();
  const todayStr = new Date().toISOString().split('T')[0];

  const chartGridColor = isDark ? '#334155' : '#e2e8f0';
  const chartTickColor = isDark ? '#94a3b8' : '#475569';
  const chartTooltipStyle = {
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderRadius: '8px',
    fontSize: '12px',
    border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
    color: isDark ? '#f1f5f9' : '#0f172a'
  };

  const currentUserCarreras = getUserCarreraIds(currentUser);

  // Filters for Director / Jefe de Carrera Dashboard
  const [selectedCarrera, setSelectedCarrera] = useState<string>(
    currentRole === 'jefe_carrera' && currentUserCarreras.length === 1 ? currentUserCarreras[0] : 'all'
  );

  useEffect(() => {
    if (currentRole === 'jefe_carrera' && currentUserCarreras.length === 1) {
      setSelectedCarrera(currentUserCarreras[0]);
    } else {
      setSelectedCarrera('all');
    }
  }, [currentRole, currentUser?.uid, currentUserCarreras.join(',')]);

  // ----------------------------------------------------
  // 1. DASHBOARD DEL ALUMNO (Requirement 39)
  // ----------------------------------------------------
  if (currentRole === 'alumno') {
    const misAsesorias = asesorias.filter(a => a.alumnoId === currentUser?.uid);
    const misAsesoriasHoy = misAsesorias.filter(
      a =>
        a.fechaProgramada === todayStr &&
        (a.estado === 'confirmada' || a.estado === 'asignada' || a.estado === 'en_proceso')
    );
    const pendientes = misAsesorias.filter(a => a.estado === 'pendiente' || a.estado === 'en_revision');
    const proximas = misAsesorias.filter(a => a.estado === 'confirmada' || a.estado === 'asignada');
    const realizadas = misAsesorias.filter(a => a.estado === 'realizada' || a.estado === 'cerrada');

    // Find next upcoming
    const proximaAsesoria = proximas.sort((a, b) => {
      const dateA = a.fechaProgramada || '9999';
      const dateB = b.fechaProgramada || '9999';
      return dateA.localeCompare(dateB);
    })[0];

    const notifsHoyAlumno = getUnreadForWidget({ advisoryIds: misAsesoriasHoy.map(a => a.id) });
    const notifsPendientesAlumno = getUnreadForWidget({
      tipos: ['autorizacion', 'cancelacion', 'solicitud'],
      advisoryIds: pendientes.map(a => a.id)
    });
    const notifsProximasAlumno = getUnreadForWidget({
      tipos: ['asignacion'],
      advisoryIds: proximas.map(a => a.id)
    });
    const notifsRealizadasAlumno = getUnreadForWidget({
      tipos: ['seguimiento'],
      advisoryIds: realizadas.map(a => a.id)
    });

    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Welcome Hero Banner */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg border-b-4 border-amber-500 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Portal del Estudiante
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight">
              Bienvenido, {currentUser?.nombre} {currentUser?.apellidoPaterno}
            </h1>
            <p className="text-emerald-100/90 text-sm mt-2 leading-relaxed">
              Consulta el estatus de tus asesorías académicas, solicita apoyo con tus materias y da seguimiento a tus fichas de resultados.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onOpenSolicitudModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold text-sm shadow-md transition-all transform hover:-translate-y-0.5"
              >
                <PlusCircle className="w-4 h-4" />
                Solicitar Asesoría
              </button>
              <button
                type="button"
                onClick={() => onNavigate('asesorias')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition-colors"
              >
                Ver Mis Asesorías
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <LiveNotificationsBanner
          unreadNotifications={unreadNotifications}
          onSelectAdvisory={onSelectAdvisory}
          onMarkRead={markRead}
          onMarkAllRead={markAllRead}
        />

        {/* Clickable Summary Widgets (Alumno) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() => {
              markIdsRead(notifsHoyAlumno.map(n => n.id));
              onNavigate('asesorias', { fecha: todayStr });
            }}
            className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 shadow-xs hover:shadow-md transition-all text-left group relative"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5 min-h-[20px]">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mis Asesorías Hoy</p>
              <WidgetNotificationBadge items={notifsHoyAlumno} tone="amber" compact />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{misAsesoriasHoy.length}</p>
                {notifsHoyAlumno[0] && (
                  <p className="text-[10px] font-medium text-amber-700 dark:text-amber-300 mt-0.5 line-clamp-1">
                    {notifsHoyAlumno[0].titulo}
                  </p>
                )}
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/60 rounded-xl text-amber-600 dark:text-amber-400 shrink-0">
                <Clock className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-semibold text-amber-700 dark:text-amber-400">
              <span>{misAsesoriasHoy.length > 0 ? 'Ver agenda de hoy' : 'Revisar sesiones'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              markIdsRead(notifsPendientesAlumno.map(n => n.id));
              onNavigate('solicitudes', { estado: 'pendiente' });
            }}
            className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-xs hover:shadow-md transition-all text-left group relative"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5 min-h-[20px]">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Solicitudes Pendientes</p>
              <WidgetNotificationBadge items={notifsPendientesAlumno} tone="amber" compact />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pendientes.length}</p>
                {notifsPendientesAlumno[0] && (
                  <p className="text-[10px] font-medium text-amber-700 dark:text-amber-300 mt-0.5 line-clamp-1">
                    {notifsPendientesAlumno[0].titulo}
                  </p>
                )}
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/60 rounded-xl text-amber-600 dark:text-amber-400 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-semibold text-emerald-800 dark:text-emerald-400">
              <span>Ir a Mis Solicitudes</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              markIdsRead(notifsProximasAlumno.map(n => n.id));
              onNavigate('asesorias', { estado: 'confirmada' });
            }}
            className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-500 shadow-xs hover:shadow-md transition-all text-left group relative"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5 min-h-[20px]">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Asesorías Próximas</p>
              <WidgetNotificationBadge items={notifsProximasAlumno} tone="teal" compact />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-2xl font-bold text-teal-700 dark:text-teal-400">{proximas.length}</p>
                {notifsProximasAlumno[0] && (
                  <p className="text-[10px] font-medium text-teal-700 dark:text-teal-300 mt-0.5 line-clamp-1">
                    {notifsProximasAlumno[0].titulo}
                  </p>
                )}
              </div>
              <div className="p-3 bg-teal-50 dark:bg-teal-950/60 rounded-xl text-teal-700 dark:text-teal-400 shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-semibold text-teal-700 dark:text-teal-400">
              <span>Ver confirmadas</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              markIdsRead(notifsRealizadasAlumno.map(n => n.id));
              onNavigate('historial');
            }}
            className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-xs hover:shadow-md transition-all text-left group relative"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5 min-h-[20px]">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Asesorías Realizadas</p>
              <WidgetNotificationBadge items={notifsRealizadasAlumno} tone="emerald" compact />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-400">{realizadas.length}</p>
                {notifsRealizadasAlumno[0] && (
                  <p className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300 mt-0.5 line-clamp-1">
                    {notifsRealizadasAlumno[0].titulo}
                  </p>
                )}
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-800 dark:text-emerald-400 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-semibold text-emerald-800 dark:text-emerald-400">
              <span>Ir al Historial</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        </div>

        {/* Próxima Asesoría Destacada */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-800 dark:text-emerald-400" />
              Próxima Asesoría Programada
            </h2>
            {proximaAsesoria && (
              <StatusBadge estado={proximaAsesoria.estado} />
            )}
          </div>

          <div className="p-6">
            {proximaAsesoria ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase block">Materia</span>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">{proximaAsesoria.materiaNombre}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{proximaAsesoria.materiaCodigo}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase block">Docente Asesor</span>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">{proximaAsesoria.docenteAsignadoNombre || 'Por asignar'}</p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Asesor Especialista</p>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase block">Fecha y Horario</span>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">{proximaAsesoria.fechaProgramada || 'Pendiente'}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{proximaAsesoria.horaInicio} - {proximaAsesoria.horaTermino} hrs</p>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase block">Lugar / Modalidad</span>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">{proximaAsesoria.aulaNombre || 'Aula asignada'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{proximaAsesoria.modalidad || 'Presencial'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">Temas a trabajar:</span> {proximaAsesoria.temasDificultad}
                  </p>
                  <button
                    type="button"
                    onClick={() => onSelectAdvisory(proximaAsesoria.id)}
                    className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 flex items-center gap-1 hover:underline"
                  >
                    Ver detalle completo
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">No tienes asesorías próximas confirmadas</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  Si presentas dificultades en alguna materia de tu cuatrimestre, puedes generar una nueva solicitud de asesoría en cualquier momento.
                </p>
                <button
                  type="button"
                  onClick={onOpenSolicitudModal}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs"
                >
                  <PlusCircle className="w-4 h-4" />
                  Solicitar una asesoría ahora
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recent History Table Preview */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Historial Reciente de Asesorías</h2>
            <button
              type="button"
              onClick={() => onNavigate('historial')}
              className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 hover:underline"
            >
              Ver todo el historial
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">Folio</th>
                  <th className="px-4 py-3">Materia</th>
                  <th className="px-4 py-3">Docente</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {misAsesorias.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500">
                      No has solicitado ninguna asesoría hasta el momento.
                    </td>
                  </tr>
                ) : (
                  misAsesorias.slice(0, 5).map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-slate-800 dark:text-emerald-300">{item.folio}</td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{item.materiaNombre}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.docenteAsignadoNombre || 'Por asignar'}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{item.fechaProgramada || item.fechaSolicitud}</td>
                      <td className="px-4 py-3"><StatusBadge estado={item.estado} /></td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => onSelectAdvisory(item.id)}
                          className="text-emerald-800 dark:text-emerald-400 font-semibold hover:underline"
                        >
                          Ver ficha
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 2. DASHBOARD DEL PERSONAL DOCENTE (PTC Tutor / PA / Administrativo Docente)
  // ----------------------------------------------------
  if (isTeachingRole(currentRole)) {
    const roleMeta = getRoleMeta(currentRole);
    const canCanalizar = canCreateSolicitudForStudents(currentRole);
    const misCarreras = currentUserCarreras
      .map(id => carreras.find(c => c.id === id))
      .filter((c): c is NonNullable<typeof c> => Boolean(c));
    const misAsesorias = asesorias.filter(a => a.docenteAsignadoId === currentUser?.uid);
    const hoy = misAsesorias.filter(a => a.fechaProgramada === todayStr && (a.estado === 'confirmada' || a.estado === 'asignada' || a.estado === 'en_proceso'));
    const pendientesSeguimiento = misAsesorias.filter(
      a => a.estado === 'confirmada' || a.estado === 'en_proceso' || (a.estado === 'realizada' && !a.seguimiento)
    );
    const proximas = misAsesorias.filter(a => (a.fechaProgramada || '') >= todayStr && a.fechaProgramada !== todayStr && (a.estado === 'confirmada' || a.estado === 'asignada'));
    const realizadas = misAsesorias.filter(a => a.estado === 'realizada' || a.estado === 'cerrada');
    const dispRecurrentes = SIAADataService.getDisponibilidadesRecurrentes(currentUser?.uid);
    const dispEspecificas = SIAADataService.getDisponibilidadesEspecificas(currentUser?.uid);
    const totalHorarios = dispRecurrentes.length + dispEspecificas.length;

    const notifsHoyDocente = getUnreadForWidget({ advisoryIds: hoy.map(a => a.id) });
    const notifsSegDocente = getUnreadForWidget({
      tipos: ['asignacion'],
      advisoryIds: pendientesSeguimiento.map(a => a.id),
      requireBoth: true
    });
    const notifsProximasDocente = getUnreadForWidget({
      tipos: ['asignacion', 'cancelacion'],
      advisoryIds: proximas.map(a => a.id)
    });
    const notifsRealizadasDocente = getUnreadForWidget({
      tipos: ['seguimiento'],
      advisoryIds: realizadas.map(a => a.id)
    });

    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Header Hero */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${roleMeta.badgeClass}`}>
                Nivel {roleMeta.nivel} • {roleMeta.label}
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {roleMeta.portalTitle}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 font-serif">
              {currentUser?.nombre} {currentUser?.apellidoPaterno}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              No. Empleado: <span className="font-mono font-medium">{currentUser?.numeroEmpleado || 'N/A'}</span> | {currentUser?.correo}
            </p>
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Carreras adscritas:</span>
              {misCarreras.length > 0 ? (
                misCarreras.map(c => (
                  <span
                    key={c.id}
                    title={c.nombre}
                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-200"
                  >
                    {c.codigo}
                  </span>
                ))
              ) : (
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">Todas (Institucional)</span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {canCanalizar && (
              <button
                type="button"
                onClick={onOpenSolicitudModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold text-xs shadow-xs transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                Canalizar / Solicitar Asesoría
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigate('disponibilidad')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition-colors"
            >
              <Clock className="w-4 h-4 text-amber-400" />
              Configurar Disponibilidad
            </button>
            <button
              type="button"
              onClick={() => onNavigate('calendario')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors"
            >
              <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              Mi Calendario
            </button>
          </div>
        </div>

        <LiveNotificationsBanner
          unreadNotifications={unreadNotifications}
          onSelectAdvisory={onSelectAdvisory}
          onMarkRead={markRead}
          onMarkAllRead={markAllRead}
        />

        {/* Clickable Summary Widgets (Docentes) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <button
            type="button"
            onClick={() => {
              markIdsRead(notifsHoyDocente.map(n => n.id));
              onNavigate('asesorias', { fecha: todayStr });
            }}
            className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 shadow-xs hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-start justify-between gap-2 min-h-[20px]">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Mis Asesorías Hoy</p>
              <WidgetNotificationBadge items={notifsHoyDocente} tone="amber" compact />
            </div>
            <div className="flex items-center justify-between mt-2">
              <div>
                <span className="text-2xl font-bold text-amber-700 dark:text-amber-400">{hoy.length}</span>
                {notifsHoyDocente[0] && (
                  <p className="text-[10px] font-medium text-amber-700 dark:text-amber-300 line-clamp-1">{notifsHoyDocente[0].titulo}</p>
                )}
              </div>
              <span className="p-2.5 bg-amber-50 dark:bg-amber-950/60 rounded-lg text-amber-700 dark:text-amber-400 shrink-0"><Clock className="w-5 h-5" /></span>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-semibold text-amber-700 dark:text-amber-400">
              <span>Ir a sesiones de hoy</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              markIdsRead(notifsSegDocente.map(n => n.id));
              onNavigate('seguimiento', { estado: 'sin_seguimiento' });
            }}
            className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-xs hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-start justify-between gap-2 min-h-[20px]">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Pend. de Seguimiento</p>
              <WidgetNotificationBadge items={notifsSegDocente} tone="emerald" compact />
            </div>
            <div className="flex items-center justify-between mt-2">
              <div>
                <span className="text-2xl font-bold text-emerald-800 dark:text-emerald-400">{pendientesSeguimiento.length}</span>
                {notifsSegDocente[0] && (
                  <p className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300 line-clamp-1">{notifsSegDocente[0].titulo}</p>
                )}
              </div>
              <span className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg text-emerald-800 dark:text-emerald-400 shrink-0"><ClipboardList className="w-5 h-5" /></span>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-semibold text-emerald-800 dark:text-emerald-400">
              <span>Registrar seguimiento</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              markIdsRead(notifsProximasDocente.map(n => n.id));
              onNavigate('asesorias', { estado: 'confirmada' });
            }}
            className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-500 shadow-xs hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-start justify-between gap-2 min-h-[20px]">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Próximas Sesiones</p>
              <WidgetNotificationBadge items={notifsProximasDocente} tone="teal" compact />
            </div>
            <div className="flex items-center justify-between mt-2">
              <div>
                <span className="text-2xl font-bold text-teal-700 dark:text-teal-400">{proximas.length}</span>
                {notifsProximasDocente[0] && (
                  <p className="text-[10px] font-medium text-teal-700 dark:text-teal-300 line-clamp-1">{notifsProximasDocente[0].titulo}</p>
                )}
              </div>
              <span className="p-2.5 bg-teal-50 dark:bg-teal-950/60 rounded-lg text-teal-700 dark:text-teal-400 shrink-0"><Calendar className="w-5 h-5" /></span>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-semibold text-teal-700 dark:text-teal-400">
              <span>Ver agenda próxima</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              markIdsRead(notifsRealizadasDocente.map(n => n.id));
              onNavigate('historial');
            }}
            className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-xs hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-start justify-between gap-2 min-h-[20px]">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Asesorías Realizadas</p>
              <WidgetNotificationBadge items={notifsRealizadasDocente} tone="emerald" compact />
            </div>
            <div className="flex items-center justify-between mt-2">
              <div>
                <span className="text-2xl font-bold text-emerald-800 dark:text-emerald-400">{realizadas.length}</span>
                {notifsRealizadasDocente[0] && (
                  <p className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300 line-clamp-1">{notifsRealizadasDocente[0].titulo}</p>
                )}
              </div>
              <span className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg text-emerald-800 dark:text-emerald-400 shrink-0"><CheckCircle2 className="w-5 h-5" /></span>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-semibold text-emerald-800 dark:text-emerald-400">
              <span>Ir al historial</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('disponibilidad')}
            className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 shadow-xs hover:shadow-md transition-all text-left group"
          >
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Horarios Registrados</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totalHorarios}</span>
              <span className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300"><Layers className="w-5 h-5" /></span>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              <span>Gestionar horarios</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        </div>

        {/* Asesorías de hoy / próximas list */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hoy & Urgentes */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                Asesorías de Hoy / En Curso
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('asesorias', { fecha: todayStr })}
                className="text-xs text-emerald-800 dark:text-emerald-400 font-semibold hover:underline"
              >
                Fecha: {todayStr} →
              </button>
            </div>

            {hoy.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                No tienes sesiones de asesoría programadas para el día de hoy.
              </div>
            ) : (
              <div className="space-y-3">
                {hoy.map(item => (
                  <div key={item.id} className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-900 dark:text-emerald-300">{item.folio}</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{item.materiaNombre}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        Alumno: <span className="font-semibold">{item.alumnoNombre}</span> ({item.matricula})
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.horaInicio} - {item.horaTermino} hrs | Aula: {item.aulaNombre}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectAdvisory(item.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-800 text-white text-xs font-semibold hover:bg-emerald-700"
                    >
                      Registrar Resultado
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Próximas Asignadas */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-700 dark:text-teal-400" />
                Próximas Sesiones Asignadas
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('asesorias')}
                className="text-xs text-emerald-800 dark:text-emerald-400 font-semibold hover:underline"
              >
                Ver todas
              </button>
            </div>

            {proximas.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                No hay asesorías próximas programadas en tu agenda.
              </div>
            ) : (
              <div className="space-y-3">
                {proximas.slice(0, 4).map(item => (
                  <div key={item.id} className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{item.materiaNombre}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {item.alumnoNombre} • {item.fechaProgramada} ({item.horaInicio} - {item.horaTermino})
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectAdvisory(item.id)}
                      className="text-xs text-emerald-800 dark:text-emerald-400 font-semibold hover:underline"
                    >
                      Ver Ficha
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 3. DASHBOARD DE DIRECCIÓN ACADÉMICA / JEFATURA DE CARRERA
  // ----------------------------------------------------
  if (currentRole === 'director' || currentRole === 'jefe_carrera') {
    const roleMeta = getRoleMeta(currentRole);
    const availableCarreras =
      currentRole === 'jefe_carrera' && currentUserCarreras.length > 0
        ? carreras.filter(c => currentUserCarreras.includes(c.id))
        : currentUserCarreras.length > 0
        ? carreras.filter(c => currentUserCarreras.includes(c.id))
        : carreras;

    const activeScopeIds =
      selectedCarrera !== 'all'
        ? [selectedCarrera]
        : currentUserCarreras.length > 0
        ? currentUserCarreras
        : [];

    const filteredByCarrera =
      activeScopeIds.length === 0
        ? asesorias
        : asesorias.filter(a => activeScopeIds.includes(a.carreraId));

    const totalAlumnos = users.filter(
      u => u.rol === 'alumno' && u.estado === 'activo' && userMatchesCareerScope(u, activeScopeIds)
    ).length;
    const totalDocentes = users.filter(
      u => isTeachingRole(u.rol) && u.estado === 'activo' && userMatchesCareerScope(u, activeScopeIds)
    ).length;
    const pendientes = filteredByCarrera.filter(a => a.estado === 'pendiente' || a.estado === 'en_revision');
    const pendientesAsignar = filteredByCarrera.filter(
      a => !a.docenteAsignadoId && (a.estado === 'pendiente' || a.estado === 'en_revision' || a.estado === 'aprobada')
    );
    const programadasHoy = filteredByCarrera.filter(
      a => a.fechaProgramada === todayStr && (a.estado === 'confirmada' || a.estado === 'asignada' || a.estado === 'en_proceso')
    );
    const aprobadas = filteredByCarrera.filter(a => a.estado === 'aprobada' || a.estado === 'asignada' || a.estado === 'confirmada');
    const realizadas = filteredByCarrera.filter(a => a.estado === 'realizada' || a.estado === 'cerrada');

    // Downward hierarchy users within active career scope
    const downwardLevels = ROLE_HIERARCHY.filter(l => l.nivel > roleMeta.nivel);
    const downwardUsers = users.filter(
      u =>
        u.estado === 'activo' &&
        getRoleMeta(u.rol).nivel > roleMeta.nivel &&
        userMatchesCareerScope(u, activeScopeIds)
    );

    // Chart data: Asesorías por Materia
    const materiaCounts: Record<string, number> = {};
    filteredByCarrera.forEach(a => {
      materiaCounts[a.materiaNombre] = (materiaCounts[a.materiaNombre] || 0) + 1;
    });
    const dataMaterias = Object.entries(materiaCounts).map(([name, count]) => ({
      name: name.length > 18 ? name.slice(0, 18) + '...' : name,
      total: count
    }));

    // Chart data: Asesorías por Estado
    const estadoCounts: Record<string, number> = {};
    filteredByCarrera.forEach(a => {
      estadoCounts[a.estado] = (estadoCounts[a.estado] || 0) + 1;
    });
    const COLORS = ['#0f766e', '#d97706', '#2563eb', '#16a34a', '#e11d48', '#64748b'];
    const dataEstados = Object.entries(estadoCounts).map(([name, value]) => ({
      name: name.toUpperCase().replace('_', ' '),
      value
    }));

    const scopeCodesLabel = availableCarreras.map(c => c.codigo).join(', ');
    const selectedCareerObj = carreras.find(c => c.id === selectedCarrera);
    const activeCareerParam = selectedCarrera !== 'all' ? selectedCarrera : undefined;

    const notifsPendAsignarDir = getUnreadForWidget({
      tipos: ['solicitud'],
      advisoryIds: pendientesAsignar.map(a => a.id)
    });
    const notifsHoyDir = getUnreadForWidget({ advisoryIds: programadasHoy.map(a => a.id) });
    const notifsPendDir = getUnreadForWidget({
      tipos: ['solicitud'],
      advisoryIds: pendientes.map(a => a.id)
    });
    const notifsAprobDir = getUnreadForWidget({
      tipos: ['autorizacion', 'asignacion'],
      advisoryIds: aprobadas.map(a => a.id),
      requireBoth: true
    });
    const notifsRealizadasDir = getUnreadForWidget({
      tipos: ['seguimiento'],
      advisoryIds: realizadas.map(a => a.id),
      requireBoth: true
    });

    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Header with Period & Career Filters */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${roleMeta.badgeClass}`}>
              Nivel {roleMeta.nivel} • {currentRole === 'director'
                ? `Dirección de Asuntos Académicos${currentUserCarreras.length > 0 ? ` (${scopeCodesLabel})` : ''}`
                : `Jefatura de Carrera (${selectedCareerObj ? selectedCareerObj.codigo : scopeCodesLabel || 'Todas'})`}
            </span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 font-serif">
              Indicadores Académicos y Seguimiento Jerárquico
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {currentRole === 'jefe_carrera'
                ? 'Supervisión, autorización y seguimiento de los niveles inferiores en sus carreras adscritas.'
                : 'Supervisión institucional de rezago pedagógico, desempeño y estructura jerárquica descendente.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {(availableCarreras.length > 1 || currentRole === 'director') && (
              <select
                value={selectedCarrera}
                onChange={(e) => setSelectedCarrera(e.target.value)}
                className="text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-emerald-700"
              >
                <option value="all">
                  {currentUserCarreras.length > 0 ? `Todas mis carreras (${scopeCodesLabel})` : 'Todas las Carreras'}
                </option>
                {availableCarreras.map(c => (
                  <option key={c.id} value={c.id}>{c.codigo} - {c.nombre}</option>
                ))}
              </select>
            )}

            {currentRole === 'jefe_carrera' && (
              <button
                type="button"
                onClick={onOpenSolicitudModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-emerald-950 rounded-lg text-xs font-bold shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                Canalizar Alumno
              </button>
            )}

            <button
              type="button"
              onClick={() => onNavigate('solicitudes', { estado: 'sin_asignar' })}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors"
            >
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Autorizar / Asignar
            </button>

            <button
              type="button"
              onClick={() => onNavigate('reportes')}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-900 text-white rounded-lg text-xs font-semibold hover:bg-emerald-800 shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-400" />
              Generar Reporte
            </button>
          </div>
        </div>

        <LiveNotificationsBanner
          unreadNotifications={unreadNotifications}
          onSelectAdvisory={onSelectAdvisory}
          onMarkRead={markRead}
          onMarkAllRead={markAllRead}
        />

        {/* Actionable Summary Widgets (Dirección / Jefatura) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => {
              markIdsRead(notifsPendAsignarDir.map(n => n.id));
              onNavigate('solicitudes', { estado: 'sin_asignar' });
            }}
            className="bg-amber-50/70 dark:bg-amber-950/30 p-5 rounded-xl border border-amber-200 dark:border-amber-800/80 hover:border-amber-500 dark:hover:border-amber-500 shadow-xs hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase">Asesorías Pendientes de Asignar</p>
                  <WidgetNotificationBadge items={notifsPendAsignarDir} tone="amber" />
                </div>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1">{pendientesAsignar.length}</p>
                <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-1">
                  {notifsPendAsignarDir[0] ? notifsPendAsignarDir[0].titulo : 'Solicitudes sin docente o espacio asignado'}
                </p>
              </div>
              <span className="p-2.5 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
                <UserCheck className="w-5 h-5" />
              </span>
            </div>
            <div className="mt-3 pt-2.5 border-t border-amber-200/70 dark:border-amber-800/60 flex items-center justify-between text-[11px] font-bold text-amber-900 dark:text-amber-300">
              <span>Ir a asignar docente</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              markIdsRead(notifsHoyDir.map(n => n.id));
              onNavigate('asesorias', { fecha: todayStr, carreraId: activeCareerParam });
            }}
            className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-500 shadow-xs hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-bold text-teal-800 dark:text-teal-300 uppercase">Asesorías Programadas Hoy</p>
                  <WidgetNotificationBadge items={notifsHoyDir} tone="teal" />
                </div>
                <p className="text-2xl font-bold text-teal-700 dark:text-teal-400 mt-1">{programadasHoy.length}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {notifsHoyDir[0] ? notifsHoyDir[0].titulo : `Agenda del día (${todayStr})`}
                </p>
              </div>
              <span className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 shrink-0">
                <Clock className="w-5 h-5" />
              </span>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-teal-700 dark:text-teal-400">
              <span>Ver asesorías de hoy</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('calendario')}
            className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-xs hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase">Agenda y Calendario Activo</p>
                  <WidgetNotificationBadge items={notifsAprobDir} tone="emerald" />
                </div>
                <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-400 mt-1">{aprobadas.length}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Sesiones aprobadas y confirmadas
                </p>
              </div>
              <span className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 shrink-0">
                <Calendar className="w-5 h-5" />
              </span>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-emerald-800 dark:text-emerald-400">
              <span>Abrir calendario mensual</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        </div>

        {/* Executive Stats Cards (Clickable) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <button
            type="button"
            onClick={() => onNavigate('reportes')}
            className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-xs hover:shadow-md transition-all text-left group"
          >
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Alumnos Registrados</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{totalAlumnos}</p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 font-medium flex items-center justify-between">
              <span>Nivel 7 en alcance</span>
              <ArrowRight className="w-3 h-3 opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate(currentRole === 'jefe_carrera' ? 'disponibilidad' : 'reportes')}
            className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-xs hover:shadow-md transition-all text-left group"
          >
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Docentes Asesores</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{totalDocentes}</p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 font-medium flex items-center justify-between">
              <span>Niveles 4, 5 y 6 adscritos</span>
              <ArrowRight className="w-3 h-3 opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              markIdsRead(notifsPendDir.map(n => n.id));
              onNavigate('solicitudes', { estado: 'pendiente' });
            }}
            className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 shadow-xs hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Pendientes Revisión</p>
              <WidgetNotificationBadge items={notifsPendDir} tone="amber" compact />
            </div>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{pendientes.length}</p>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 font-medium flex items-center justify-between">
              <span>Por autorizar</span>
              <ArrowRight className="w-3 h-3 opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              markIdsRead(notifsAprobDir.map(n => n.id));
              onNavigate('asesorias', { estado: 'activas', carreraId: activeCareerParam });
            }}
            className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-500 shadow-xs hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Aprobadas / Agendadas</p>
              <WidgetNotificationBadge items={notifsAprobDir} tone="teal" compact />
            </div>
            <p className="text-2xl font-bold text-teal-700 dark:text-teal-400 mt-1">{aprobadas.length}</p>
            <p className="text-[11px] text-teal-700 dark:text-teal-400 mt-1 font-medium flex items-center justify-between">
              <span>En proceso de atención</span>
              <ArrowRight className="w-3 h-3 opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              markIdsRead(notifsRealizadasDir.map(n => n.id));
              onNavigate('historial', { carreraId: activeCareerParam });
            }}
            className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-xs hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Realizadas y Cerradas</p>
              <WidgetNotificationBadge items={notifsRealizadasDir} tone="emerald" compact />
            </div>
            <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-400 mt-1">{realizadas.length}</p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 font-medium flex items-center justify-between">
              <span>Ver historial</span>
              <ArrowRight className="w-3 h-3 opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </p>
          </button>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Materias con mayor demanda */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
              Materias con Mayor Demanda de Asesoría
            </h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataMaterias} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: chartTickColor }} angle={-25} textAnchor="end" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: chartTickColor }} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="total" fill="#0f766e" radius={[4, 4, 0, 0]} name="Asesorías" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Estado de las asesorías */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
              Distribución por Estado de Solicitudes
            </h2>
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataEstados}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {dataEstados.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: chartTickColor }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Downward Hierarchical Tracking Section */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Seguimiento Jerárquico de Niveles Inferiores
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personal docente, jefaturas y alumnado bajo la cobertura de sus carreras adscritas ({downwardUsers.length} usuarios activos).
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {downwardLevels.map(lvl => {
                const count = downwardUsers.filter(u => u.rol === lvl.code).length;
                return (
                  <span
                    key={lvl.code}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold ${lvl.badgeClass}`}
                  >
                    N{lvl.nivel} {lvl.shortLabel}: {count}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">Nivel / Rol</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Carreras Adscritas</th>
                  <th className="px-4 py-3">Asesorías en Alcance</th>
                  <th className="px-4 py-3">Realizadas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {downwardUsers
                  .filter(u => u.rol !== 'alumno')
                  .concat(downwardUsers.filter(u => u.rol === 'alumno').slice(0, 6))
                  .map(sub => {
                    const subMeta = getRoleMeta(sub.rol);
                    const subCarrCodes = getUserCarreraIds(sub)
                      .map(id => carreras.find(c => c.id === id)?.codigo)
                      .filter(Boolean);
                    const subAsesorias =
                      sub.rol === 'alumno'
                        ? filteredByCarrera.filter(a => a.alumnoId === sub.uid)
                        : filteredByCarrera.filter(a => a.docenteAsignadoId === sub.uid);
                    const subDone = subAsesorias.filter(a => a.estado === 'realizada' || a.estado === 'cerrada').length;
                    return (
                      <tr key={sub.uid} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${subMeta.badgeClass}`}>
                            N{subMeta.nivel} • {subMeta.shortLabel}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-slate-100">
                          {sub.nombre} {sub.apellidoPaterno} {sub.apellidoMaterno}
                          <span className="block text-[10px] font-mono text-slate-400 dark:text-slate-500">
                            {sub.matricula || sub.numeroEmpleado || sub.correo}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {subCarrCodes.length > 0 ? (
                              subCarrCodes.map(code => (
                                <span
                                  key={code}
                                  className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono font-semibold text-slate-700 dark:text-slate-300"
                                >
                                  {code}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-400">Todas</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 font-bold text-slate-800 dark:text-slate-200">{subAsesorias.length}</td>
                        <td className="px-4 py-2.5 font-bold text-emerald-700 dark:text-emerald-400">{subDone}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 4. DASHBOARD DEL ADMINISTRADOR (Nivel 1)
  // ----------------------------------------------------
  const totalAlumnos = users.filter(u => u.rol === 'alumno').length;
  const totalDocentes = users.filter(u => isTeachingRole(u.rol)).length;
  const totalDirectivos = users.filter(u => u.rol === 'director' || u.rol === 'jefe_carrera').length;
  const pendientesAsignarAdmin = asesorias.filter(
    a => !a.docenteAsignadoId && (a.estado === 'pendiente' || a.estado === 'en_revision' || a.estado === 'aprobada')
  );
  const programadasHoyAdmin = asesorias.filter(
    a => a.fechaProgramada === todayStr && (a.estado === 'confirmada' || a.estado === 'asignada' || a.estado === 'en_proceso')
  );
  const pendientesSeguimientoAdmin = asesorias.filter(
    a => a.estado === 'confirmada' || a.estado === 'en_proceso' || (a.estado === 'realizada' && !a.seguimiento)
  );
  const solicitudesPendientes = asesorias.filter(a => a.estado === 'pendiente' || a.estado === 'en_revision').length;
  const asesoriasAprobadas = asesorias.filter(a => a.estado === 'aprobada' || a.estado === 'asignada' || a.estado === 'confirmada').length;
  const asesoriasRealizadas = asesorias.filter(a => a.estado === 'realizada' || a.estado === 'cerrada').length;
  const asesoriasCanceladas = asesorias.filter(a => a.estado === 'cancelada' || a.estado === 'rechazada').length;
  
  // Alumnos únicos atendidos
  const uniqueStudents = new Set(asesorias.filter(a => a.estado === 'realizada' || a.estado === 'cerrada').map(a => a.alumnoId)).size;

  // Chart data: Por carrera
  const carreraCounts: Record<string, number> = {};
  asesorias.forEach(a => {
    const c = carreras.find(car => car.id === a.carreraId);
    const label = c ? c.codigo : 'Otra';
    carreraCounts[label] = (carreraCounts[label] || 0) + 1;
  });
  const dataCarreras = Object.entries(carreraCounts).map(([name, total]) => ({ name, total }));

  // Chart data: Por docente
  const docenteCounts: Record<string, number> = {};
  asesorias.forEach(a => {
    if (a.docenteAsignadoNombre) {
      docenteCounts[a.docenteAsignadoNombre.split(' ')[0] + ' ' + (a.docenteAsignadoNombre.split(' ')[1] || '')] =
        (docenteCounts[a.docenteAsignadoNombre.split(' ')[0] + ' ' + (a.docenteAsignadoNombre.split(' ')[1] || '')] || 0) + 1;
    }
  });
  const dataDocentes = Object.entries(docenteCounts).map(([name, total]) => ({ name, total }));

  const notifsPendAsignarAdmin = getUnreadForWidget({
    tipos: ['solicitud'],
    advisoryIds: pendientesAsignarAdmin.map(a => a.id)
  });
  const notifsHoyAdmin = getUnreadForWidget({ advisoryIds: programadasHoyAdmin.map(a => a.id) });
  const notifsPorAutorizarAdmin = getUnreadForWidget({ tipos: ['solicitud'] });
  const notifsPendSegAdmin = getUnreadForWidget({
    advisoryIds: pendientesSeguimientoAdmin.map(a => a.id)
  });
  const notifsAprobAdmin = getUnreadForWidget({ tipos: ['autorizacion', 'asignacion'] });
  const notifsRealizadasAdmin = getUnreadForWidget({ tipos: ['seguimiento'] });
  const notifsCanceladasAdmin = getUnreadForWidget({ tipos: ['cancelacion'] });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Admin Title & Quick Navigation Shortcuts */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800 uppercase tracking-wider">
            Administración General del Sistema
          </span>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 font-serif">
            Panel de Control Institucional
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gestión integral de usuarios, catálogos, horarios, asesorías e indicadores universitarios.
          </p>
        </div>

        {/* Quick Actions (Requirement 42) */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('usuarios')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            Crear Usuario
          </button>
          <button
            type="button"
            onClick={() => onNavigate('materias')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            Crear Materia
          </button>
          <button
            type="button"
            onClick={() => onNavigate('disponibilidad')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            Registrar Disponibilidad
          </button>
          <button
            type="button"
            onClick={() => onNavigate('solicitudes', { estado: 'sin_asignar' })}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-emerald-950 text-xs font-bold shadow-xs transition-colors"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            Revisar Solicitudes
          </button>
        </div>
      </div>

      <LiveNotificationsBanner
        unreadNotifications={unreadNotifications}
        onSelectAdvisory={onSelectAdvisory}
        onMarkRead={markRead}
        onMarkAllRead={markAllRead}
      />

      {/* Actionable Operational Summary Widgets (Admin) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => {
            markIdsRead(notifsPendAsignarAdmin.map(n => n.id));
            onNavigate('solicitudes', { estado: 'sin_asignar' });
          }}
          className="bg-amber-50/70 dark:bg-amber-950/30 p-5 rounded-xl border border-amber-200 dark:border-amber-800/80 hover:border-amber-500 dark:hover:border-amber-500 shadow-xs hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase">Asesorías Pendientes de Asignar</p>
                <WidgetNotificationBadge items={notifsPendAsignarAdmin} tone="amber" compact />
              </div>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1">{pendientesAsignarAdmin.length}</p>
              <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                {notifsPendAsignarAdmin[0] ? notifsPendAsignarAdmin[0].titulo : 'Sin docente asignado aún'}
              </p>
            </div>
            <span className="p-2.5 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
              <UserCheck className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-amber-200/70 dark:border-amber-800/60 flex items-center justify-between text-[11px] font-bold text-amber-900 dark:text-amber-300">
            <span>Ir a Solicitudes por asignar</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            markIdsRead(notifsHoyAdmin.map(n => n.id));
            onNavigate('asesorias', { fecha: todayStr });
          }}
          className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-500 shadow-xs hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-bold text-teal-800 dark:text-teal-300 uppercase">Asesorías Programadas Hoy</p>
                <WidgetNotificationBadge items={notifsHoyAdmin} tone="teal" compact />
              </div>
              <p className="text-2xl font-bold text-teal-700 dark:text-teal-400 mt-1">{programadasHoyAdmin.length}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {notifsHoyAdmin[0] ? notifsHoyAdmin[0].titulo : `Agenda de hoy (${todayStr})`}
              </p>
            </div>
            <span className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 shrink-0">
              <Clock className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-teal-700 dark:text-teal-400">
            <span>Ver sesiones de hoy</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            markIdsRead(notifsPorAutorizarAdmin.map(n => n.id));
            onNavigate('solicitudes', { estado: 'pendiente' });
          }}
          className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 shadow-xs hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase">Por Autorizar / Revisión</p>
                <WidgetNotificationBadge items={notifsPorAutorizarAdmin} tone="amber" compact />
              </div>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{solicitudesPendientes}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {notifsPorAutorizarAdmin[0] ? notifsPorAutorizarAdmin[0].titulo : 'Esperando dictamen académico'}
              </p>
            </div>
            <span className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-amber-700 dark:text-amber-400">
            <span>Autorizar solicitudes</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            markIdsRead(notifsPendSegAdmin.map(n => n.id));
            onNavigate('asesorias', { estado: 'sin_seguimiento' });
          }}
          className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-xs hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase">Pendientes de Seguimiento</p>
                <WidgetNotificationBadge items={notifsPendSegAdmin} tone="emerald" compact />
              </div>
              <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-400 mt-1">{pendientesSeguimientoAdmin.length}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {notifsPendSegAdmin[0] ? notifsPendSegAdmin[0].titulo : 'Sesiones activas o sin ficha'}
              </p>
            </div>
            <span className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 shrink-0">
              <ClipboardList className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-emerald-800 dark:text-emerald-400">
            <span>Ir a Asesorías</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>
      </div>

      {/* Metrics Cards (Clickable) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => onNavigate('usuarios')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-xs hover:shadow-md transition-all text-left group"
        >
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Total Alumnos</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{totalAlumnos}</p>
          <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5 font-semibold flex items-center gap-1">
            Ver usuarios <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('usuarios')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-xs hover:shadow-md transition-all text-left group"
        >
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Personal Docente</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{totalDocentes}</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Directivos/Jefes: {totalDirectivos}</p>
        </button>

        <button
          type="button"
          onClick={() => {
            markIdsRead(notifsPorAutorizarAdmin.map(n => n.id));
            onNavigate('solicitudes', { estado: 'pendiente' });
          }}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 shadow-xs hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-start justify-between gap-1">
            <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase">Solicitudes Pend.</p>
            <WidgetNotificationBadge items={notifsPorAutorizarAdmin} tone="amber" compact />
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{solicitudesPendientes}</p>
          <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5 font-semibold flex items-center gap-1">
            Revisar <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            markIdsRead(notifsAprobAdmin.map(n => n.id));
            onNavigate('asesorias', { estado: 'activas' });
          }}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-500 shadow-xs hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-start justify-between gap-1">
            <p className="text-[11px] font-semibold text-teal-700 dark:text-teal-400 uppercase">Aprobadas/Prog.</p>
            <WidgetNotificationBadge items={notifsAprobAdmin} tone="teal" compact />
          </div>
          <p className="text-2xl font-bold text-teal-700 dark:text-teal-400 mt-1">{asesoriasAprobadas}</p>
          <p className="text-[10px] text-teal-700 dark:text-teal-400 mt-0.5 font-semibold flex items-center gap-1">
            Ver activas <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            markIdsRead(notifsRealizadasAdmin.map(n => n.id));
            onNavigate('asesorias', { estado: 'realizada' });
          }}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-xs hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-start justify-between gap-1">
            <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-400 uppercase">Realizadas</p>
            <WidgetNotificationBadge items={notifsRealizadasAdmin} tone="emerald" compact />
          </div>
          <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-400 mt-1">{asesoriasRealizadas}</p>
          <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5 font-semibold flex items-center gap-1">
            Consultar <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            markIdsRead(notifsCanceladasAdmin.map(n => n.id));
            onNavigate('asesorias', { estado: 'cancelada' });
          }}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-rose-500 dark:hover:border-rose-500 shadow-xs hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-start justify-between gap-1">
            <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 uppercase">Canceladas</p>
            <WidgetNotificationBadge items={notifsCanceladasAdmin} tone="rose" compact />
          </div>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{asesoriasCanceladas}</p>
          <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5 font-semibold flex items-center gap-1">
            Ver detalle <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('reportes')}
          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-xs hover:shadow-md transition-all text-left group"
        >
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Alumnos Atendidos</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{uniqueStudents}</p>
          <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5 font-semibold flex items-center gap-1">
            Ir a Reportes <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
          </p>
        </button>
      </div>

      {/* Visual Charts (Requirement 21) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asesorías por Carrera */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
            Demanda de Asesorías por Programa Educativo
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataCarreras} margin={{ top: 10, right: 20, left: -20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: chartTickColor }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: chartTickColor }} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="total" fill="#0f766e" radius={[4, 4, 0, 0]} name="Asesorías" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asesorías por Docente Asesor */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
            Asesorías Impartidas por Docente Asesor
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataDocentes} margin={{ top: 10, right: 20, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: chartTickColor }} angle={-20} textAnchor="end" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: chartTickColor }} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="total" fill="#d97706" radius={[4, 4, 0, 0]} name="Asesorías Atendidas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Solicitudes Pendientes para Atención Rápida */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            Solicitudes que Requieren Atención Inmediata
          </h2>
          <button
            type="button"
            onClick={() => onNavigate('solicitudes')}
            className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 hover:underline"
          >
            Gestionar todas las solicitudes
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3">Folio</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Alumno</th>
                <th className="px-4 py-3">Materia</th>
                <th className="px-4 py-3">Prioridad</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {asesorias.filter(a => a.estado === 'pendiente' || a.estado === 'aprobada').length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500">
                    No hay solicitudes pendientes en este momento.
                  </td>
                </tr>
              ) : (
                asesorias
                  .filter(a => a.estado === 'pendiente' || a.estado === 'aprobada')
                  .slice(0, 5)
                  .map(a => (
                    <tr key={a.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-slate-800 dark:text-emerald-300">{a.folio}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{a.fechaSolicitud}</td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{a.alumnoNombre}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{a.materiaNombre}</td>
                      <td className="px-4 py-3"><PriorityBadge prioridad={a.prioridad} /></td>
                      <td className="px-4 py-3"><StatusBadge estado={a.estado} /></td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => onSelectAdvisory(a.id)}
                          className="px-3 py-1 bg-emerald-800 text-white rounded text-xs font-semibold hover:bg-emerald-700 shadow-2xs"
                        >
                          Atender
                        </button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
