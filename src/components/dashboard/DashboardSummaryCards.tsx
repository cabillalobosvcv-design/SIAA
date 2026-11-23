import React from 'react';
import { AlertCircle, ArrowRight, Calendar, Clock } from 'lucide-react';
import { Asesoria, Notification, User, UserRole } from '../../types/siaa';
import { SIAADataService } from '../../services/siaaService';
import { getUserCarreraIds, isTeachingRole, userHasCarrera } from '../../utils/roles';
import { WidgetNotificationBadge } from './WidgetNotificationBadge';
import { NavView } from '../layout/Sidebar';
import type { NavigationFilterOptions } from './DashboardView';

interface DashboardSummaryCardsProps {
  currentUser: User | null;
  currentRole: UserRole | null;
  selectedCarrera: string;
  todayStr: string;
  syncTick: number;
  getUnreadForWidget: (criteria: {
    tipos?: Notification['tipo'][];
    advisoryIds?: string[];
    requireBoth?: boolean;
  }) => Notification[];
  markIdsRead: (ids: string[]) => void;
  onNavigate: (view: NavView, options?: NavigationFilterOptions) => void;
}

export const DashboardSummaryCards: React.FC<DashboardSummaryCardsProps> = ({
  currentUser,
  currentRole,
  selectedCarrera,
  todayStr,
  syncTick,
  getUnreadForWidget,
  markIdsRead,
  onNavigate
}) => {
  void syncTick;
  const allAsesorias: Asesoria[] = SIAADataService.getAsesorias();
  const carreras = SIAADataService.getCarreras();
  const userCarreras = getUserCarreraIds(currentUser);

  // Determine active career scope for director / jefe_carrera
  const activeScopeIds =
    selectedCarrera !== 'all'
      ? [selectedCarrera]
      : userCarreras.length > 0
      ? userCarreras
      : [];

  const activeCareerParam =
    (currentRole === 'director' || currentRole === 'jefe_carrera') && selectedCarrera !== 'all'
      ? selectedCarrera
      : undefined;

  // Scope asesorías by user hierarchy & role
  const filterByRoleScope = (list: Asesoria[], mode: 'solicitudes' | 'agenda'): Asesoria[] => {
    if (currentRole === 'alumno') {
      return list.filter(a => a.alumnoId === currentUser?.uid);
    }
    if (isTeachingRole(currentRole)) {
      if (mode === 'solicitudes') {
        return list.filter(
          a =>
            a.docenteAsignadoId === currentUser?.uid ||
            a.solicitanteId === currentUser?.uid ||
            userCarreras.length === 0 ||
            userHasCarrera(currentUser, a.carreraId)
        );
      }
      return list.filter(a => a.docenteAsignadoId === currentUser?.uid);
    }
    if (currentRole === 'director' || currentRole === 'jefe_carrera') {
      if (activeScopeIds.length === 0) return list;
      return list.filter(a => activeScopeIds.includes(a.carreraId));
    }
    return list;
  };

  const solicitudesScope = filterByRoleScope(allAsesorias, 'solicitudes');
  const agendaScope = filterByRoleScope(allAsesorias, 'agenda');

  // 1. Total Pending Solicitudes
  const pendingSolicitudes = solicitudesScope.filter(
    a => a.estado === 'pendiente' || a.estado === 'en_revision'
  );
  const urgentPendingCount = pendingSolicitudes.filter(
    a => a.prioridad === 'urgente' || a.prioridad === 'alta'
  ).length;
  const unassignedPendingCount = pendingSolicitudes.filter(a => !a.docenteAsignadoId).length;

  // 2. Active Asesorias Today
  const activeToday = agendaScope
    .filter(
      a =>
        a.estado === 'en_proceso' ||
        (a.fechaProgramada === todayStr &&
          (a.estado === 'confirmada' || a.estado === 'asignada'))
    )
    .sort((a, b) => (a.horaInicio || '99:99').localeCompare(b.horaInicio || '99:99'));
  const nextToday = activeToday[0];

  // 3. Upcoming Appointments (future scheduled + open scheduled context)
  const upcomingAppointments = agendaScope
    .filter(
      a =>
        (a.estado === 'confirmada' || a.estado === 'asignada') &&
        (a.fechaProgramada || '') > todayStr
    )
    .sort((a, b) => {
      const dateCmp = (a.fechaProgramada || '9999').localeCompare(b.fechaProgramada || '9999');
      if (dateCmp !== 0) return dateCmp;
      return (a.horaInicio || '99:99').localeCompare(b.horaInicio || '99:99');
    });
  const nextUpcoming = upcomingAppointments[0];
  const openScheduledCount = agendaScope.filter(
    a => a.estado === 'confirmada' || a.estado === 'asignada'
  ).length;
  const approvedUnscheduledCount = agendaScope.filter(a => a.estado === 'aprobada').length;

  // Notification badges aligned with each metric
  const notifsPending = getUnreadForWidget({
    tipos: ['solicitud'],
    advisoryIds: pendingSolicitudes.map(a => a.id)
  });
  const notifsToday = getUnreadForWidget({
    advisoryIds: activeToday.map(a => a.id)
  });
  const notifsUpcoming = getUnreadForWidget({
    tipos: ['asignacion', 'autorizacion'],
    advisoryIds: upcomingAppointments.map(a => a.id)
  });

  const scopeLabel =
    currentRole === 'alumno'
      ? 'Mi historial personal'
      : isTeachingRole(currentRole)
      ? 'Mi carga docente'
      : currentRole === 'director' || currentRole === 'jefe_carrera'
      ? selectedCarrera !== 'all'
        ? carreras.find(c => c.id === selectedCarrera)?.codigo || 'Carrera seleccionada'
        : activeScopeIds.length > 0
        ? activeScopeIds.map(id => carreras.find(c => c.id === id)?.codigo).filter(Boolean).join(', ')
        : 'Todas las carreras'
      : 'Alcance institucional';

  return (
    <section aria-label="Métricas rápidas del sistema" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Resumen Operativo
          </h2>
          <span aria-hidden="true">·</span>
          <span>{scopeLabel}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">{todayStr}</span>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('calendario')}
          className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 hover:underline whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded px-1 py-0.5"
        >
          Ver calendario general →
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Pending Solicitudes */}
        <button
          type="button"
          onClick={() => {
            markIdsRead(notifsPending.map(n => n.id));
            onNavigate('solicitudes', { estado: 'pendiente_revision' });
          }}
          className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 shadow-xs hover:shadow-md transition-all text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <div className="flex items-start justify-between gap-2 min-h-[20px]">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total de Solicitudes Pendientes
            </p>
            <WidgetNotificationBadge items={notifsPending} tone="amber" compact />
          </div>

          <div className="flex items-center justify-between gap-3 mt-2">
            <div className="min-w-0">
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 tabular-nums tracking-tight">
                {pendingSolicitudes.length}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                {pendingSolicitudes.length > 0 ? (
                  <>
                    <span className="tabular-nums">{unassignedPendingCount} sin asignar</span>
                    <span aria-hidden="true"> · </span>
                    <span className="tabular-nums">{urgentPendingCount} prioritarias</span>
                  </>
                ) : (
                  'Sin solicitudes en espera'
                )}
              </p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/60 rounded-xl text-amber-600 dark:text-amber-400 shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-amber-700 dark:text-amber-400">
            <span className="whitespace-nowrap">Revisar solicitudes</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>

        {/* Card 2: Active Asesorias Today */}
        <button
          type="button"
          onClick={() => {
            markIdsRead(notifsToday.map(n => n.id));
            onNavigate('asesorias', { fecha: todayStr, carreraId: activeCareerParam });
          }}
          className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-500 shadow-xs hover:shadow-md transition-all text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
        >
          <div className="flex items-start justify-between gap-2 min-h-[20px]">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Asesorías Activas Hoy
            </p>
            <WidgetNotificationBadge items={notifsToday} tone="teal" compact />
          </div>

          <div className="flex items-center justify-between gap-3 mt-2">
            <div className="min-w-0">
              <p className="text-3xl font-bold text-teal-700 dark:text-teal-400 tabular-nums tracking-tight">
                {activeToday.length}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                {nextToday ? (
                  <>
                    <span className="font-mono tabular-nums">{nextToday.horaInicio || 'En curso'}</span>
                    <span aria-hidden="true"> · </span>
                    <span>{nextToday.materiaNombre}</span>
                  </>
                ) : (
                  <>
                    <span>Agenda</span>
                    <span aria-hidden="true"> · </span>
                    <span className="font-mono tabular-nums">{todayStr}</span>
                  </>
                )}
              </p>
            </div>
            <div className="p-3 bg-teal-50 dark:bg-teal-950/60 rounded-xl text-teal-700 dark:text-teal-400 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-teal-700 dark:text-teal-400">
            <span className="whitespace-nowrap">Ver agenda de hoy</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>

        {/* Card 3: Upcoming Appointments */}
        <button
          type="button"
          onClick={() => {
            markIdsRead(notifsUpcoming.map(n => n.id));
            onNavigate('asesorias', { estado: 'activas', carreraId: activeCareerParam });
          }}
          className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-xs hover:shadow-md transition-all text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
        >
          <div className="flex items-start justify-between gap-2 min-h-[20px]">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Próximas Citas
            </p>
            <WidgetNotificationBadge items={notifsUpcoming} tone="emerald" compact />
          </div>

          <div className="flex items-center justify-between gap-3 mt-2">
            <div className="min-w-0">
              <p className="text-3xl font-bold text-emerald-800 dark:text-emerald-400 tabular-nums tracking-tight">
                {upcomingAppointments.length}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                {nextUpcoming ? (
                  <>
                    <span className="font-mono tabular-nums">{nextUpcoming.fechaProgramada}</span>
                    {nextUpcoming.horaInicio && (
                      <>
                        <span aria-hidden="true"> · </span>
                        <span className="font-mono tabular-nums">{nextUpcoming.horaInicio}</span>
                      </>
                    )}
                    <span aria-hidden="true"> · </span>
                    <span>{nextUpcoming.materiaNombre}</span>
                  </>
                ) : openScheduledCount > 0 || approvedUnscheduledCount > 0 ? (
                  <>
                    <span className="tabular-nums">{openScheduledCount} confirmadas</span>
                    <span aria-hidden="true"> · </span>
                    <span className="tabular-nums">{approvedUnscheduledCount} por agendar</span>
                  </>
                ) : (
                  'Sin citas futuras agendadas'
                )}
              </p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-800 dark:text-emerald-400 shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-400">
            <span className="whitespace-nowrap">Consultar citas activas</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>
      </div>
    </section>
  );
};
