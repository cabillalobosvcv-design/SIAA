import React, { useState } from 'react';
import { SIAADataService } from '../../services/siaaService';
import { useAuth } from '../../context/AuthContext';
import { Asesoria, EstadoAsesoria } from '../../types/siaa';
import { StatusBadge } from '../common/StatusBadge';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  DoorOpen,
  Filter
} from 'lucide-react';
import { isTeachingRole } from '../../utils/roles';

interface CalendarViewProps {
  onSelectAdvisory: (id: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onSelectAdvisory }) => {
  const { currentUser, currentRole } = useAuth();
  const asesorias = SIAADataService.getAsesorias();
  const docentes = SIAADataService.getUsers().filter(u => isTeachingRole(u.rol));
  const aulas = SIAADataService.getAulas();

  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date(2026, 8, 1)); // Sept 2026
  const [filterDocente, setFilterDocente] = useState<string>('all');
  const [filterAula, setFilterAula] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');

  // Role filtering
  let displayAsesorias = asesorias.filter(a => a.fechaProgramada);
  if (currentRole === 'alumno') {
    displayAsesorias = displayAsesorias.filter(a => a.alumnoId === currentUser?.uid);
  } else if (isTeachingRole(currentRole)) {
    displayAsesorias = displayAsesorias.filter(a => a.docenteAsignadoId === currentUser?.uid);
  } else if (currentRole === 'jefe_carrera' && currentUser?.carreraId) {
    displayAsesorias = displayAsesorias.filter(a => a.carreraId === currentUser.carreraId);
  }

  // Filter by teacher
  if (filterDocente !== 'all') {
    displayAsesorias = displayAsesorias.filter(a => a.docenteAsignadoId === filterDocente);
  }

  // Filter by room
  if (filterAula !== 'all') {
    displayAsesorias = displayAsesorias.filter(a => a.aulaId === filterAula);
  }

  // Month navigation
  const prevMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1));
  };

  // Calendar Grid Calculation
  const year = selectedMonth.getFullYear();
  const month = selectedMonth.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Map calendar cells (Monday to Sunday)
  // Shift Sunday (0) to end (6), Monday (1) to 0
  const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
  const calendarCells: { dateStr: string; dayNumber: number; isCurrentMonth: boolean }[] = [];

  // Previous month trailing days
  const prevMonthTotalDays = new Date(year, month, 0).getDate();
  for (let i = adjustedFirstDay - 1; i >= 0; i--) {
    const d = prevMonthTotalDays - i;
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    const dateStr = `${y}-${(m + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
    calendarCells.push({ dateStr, dayNumber: d, isCurrentMonth: false });
  }

  // Current month days
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
    calendarCells.push({ dateStr, dayNumber: d, isCurrentMonth: true });
  }

  // Fill up to 35 or 42 grid cells
  const remaining = 35 - calendarCells.length;
  if (remaining > 0) {
    for (let d = 1; d <= remaining; d++) {
      const m = month === 11 ? 0 : month + 1;
      const y = month === 11 ? year + 1 : year;
      const dateStr = `${y}-${(m + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      calendarCells.push({ dateStr, dayNumber: d, isCurrentMonth: false });
    }
  }

  const getEventsForDate = (dateStr: string) => {
    return displayAsesorias.filter(a => a.fechaProgramada === dateStr);
  };

  const statusColorMap: Record<EstadoAsesoria, string> = {
    pendiente: 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    en_revision: 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    aprobada: 'bg-teal-100 dark:bg-teal-950/70 text-teal-900 dark:text-teal-300 border-teal-300 dark:border-teal-800',
    asignada: 'bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-300 border-blue-300 dark:border-blue-800',
    confirmada: 'bg-sky-100 dark:bg-sky-950/70 text-sky-900 dark:text-sky-300 border-sky-300 dark:border-sky-800',
    en_proceso: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    realizada: 'bg-emerald-200 dark:bg-emerald-900/70 text-emerald-950 dark:text-emerald-200 border-emerald-400 dark:border-emerald-700',
    cerrada: 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700',
    cancelada: 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    rechazada: 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    no_asistio: 'bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border-stone-300 dark:border-stone-700'
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header with Navigation & Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 font-serif">
            Calendario Institucional de Asesorías
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Programación semanal y mensual de sesiones, horarios y aulas en campus.
          </p>
        </div>

        {/* View Switcher & Month Navigation */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-slate-900 text-emerald-900 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Mes
            </button>
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                viewMode === 'agenda'
                  ? 'bg-white dark:bg-slate-900 text-emerald-900 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Agenda
            </button>
          </div>

          <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 bg-white dark:bg-slate-800 shadow-2xs">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 text-slate-600 dark:text-slate-300 hover:text-emerald-900 dark:hover:text-emerald-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded"
              title="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 min-w-[120px] text-center">
              {monthNames[month]} {year}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 text-slate-600 dark:text-slate-300 hover:text-emerald-900 dark:hover:text-emerald-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded"
              title="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-emerald-800 dark:text-emerald-400" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Filtros:</span>
        </div>

        {!isTeachingRole(currentRole) && (
          <select
            value={filterDocente}
            onChange={(e) => setFilterDocente(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium focus:ring-2 focus:ring-emerald-700"
          >
            <option value="all">Todos los Docentes</option>
            {docentes.map(d => (
              <option key={d.uid} value={d.uid}>{d.nombre} {d.apellidoPaterno}</option>
            ))}
          </select>
        )}

        <select
          value={filterAula}
          onChange={(e) => setFilterAula(e.target.value)}
          className="text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium focus:ring-2 focus:ring-emerald-700"
        >
          <option value="all">Todas las Aulas y Espacios</option>
          {aulas.map(a => (
            <option key={a.id} value={a.id}>{a.nombre} ({a.edificio})</option>
          ))}
        </select>
      </div>

      {/* View Mode: Month Grid */}
      {viewMode === 'month' ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          {/* Days of week header */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-center text-xs font-bold text-slate-700 dark:text-slate-200">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
              <div key={d} className="py-2.5">{d}</div>
            ))}
          </div>

          {/* Calendar Grid Days */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800 min-h-[500px]">
            {calendarCells.map((cell, idx) => {
              const dayEvents = getEventsForDate(cell.dateStr);
              return (
                <div
                  key={idx}
                  className={`p-2 min-h-[95px] flex flex-col transition-colors ${
                    cell.isCurrentMonth
                      ? 'bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                      : 'bg-slate-50/40 dark:bg-slate-950/60 text-slate-400 dark:text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-semibold ${
                        cell.isCurrentMonth ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-600'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-900/70 text-emerald-900 dark:text-emerald-200">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Event pills */}
                  <div className="space-y-1 flex-1 overflow-y-auto max-h-[80px]">
                    {dayEvents.map(evt => (
                      <button
                        key={evt.id}
                        type="button"
                        onClick={() => onSelectAdvisory(evt.id)}
                        className={`w-full text-left p-1 rounded text-[10px] border leading-tight truncate transition-all hover:scale-102 ${
                          statusColorMap[evt.estado]
                        }`}
                        title={`${evt.folio} - ${evt.materiaNombre} (${evt.horaInicio} - ${evt.horaTermino})`}
                      >
                        <span className="font-bold block truncate">{evt.horaInicio} {evt.materiaNombre}</span>
                        <span className="text-[9px] opacity-80 block truncate">{evt.docenteAsignadoNombre || evt.alumnoNombre}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* View Mode: Agenda List */
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
          {displayAsesorias.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
              No hay asesorías agendadas para el periodo y filtros seleccionados.
            </div>
          ) : (
            displayAsesorias
              .sort((a, b) => (a.fechaProgramada || '').localeCompare(b.fechaProgramada || ''))
              .map(item => (
                <div
                  key={item.id}
                  className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0 text-center min-w-[65px]">
                      <span className="text-[10px] uppercase font-bold block">{item.fechaProgramada?.split('-')[1]}</span>
                      <span className="text-base font-extrabold text-emerald-950 dark:text-emerald-200">{item.fechaProgramada?.split('-')[2]}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-emerald-950 dark:text-emerald-300">{item.folio}</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{item.materiaNombre}</span>
                        <StatusBadge estado={item.estado} />
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 mt-1">
                        Alumno: <span className="font-semibold text-slate-800 dark:text-slate-100">{item.alumnoNombre}</span> ({item.matricula}) • Docente: <span className="font-semibold text-slate-800 dark:text-slate-100">{item.docenteAsignadoNombre || 'Por asignar'}</span>
                      </p>
                      <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          {item.horaInicio} - {item.horaTermino} hrs
                        </span>
                        <span className="flex items-center gap-1">
                          <DoorOpen className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          {item.aulaNombre} ({item.modalidad})
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectAdvisory(item.id)}
                    className="px-3 py-1.5 bg-emerald-900 text-white font-semibold rounded-lg hover:bg-emerald-800 shrink-0 self-start sm:self-center text-xs"
                  >
                    Ver Ficha
                  </button>
                </div>
              ))
          )}
        </div>
      )}
    </div>
  );
};
