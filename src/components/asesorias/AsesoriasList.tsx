import React, { useEffect, useState } from 'react';
import { SIAADataService } from '../../services/siaaService';
import { useAuth } from '../../context/AuthContext';
import { Asesoria, EstadoAsesoria } from '../../types/siaa';
import { StatusBadge } from '../common/StatusBadge';
import {
  Search,
  FileSpreadsheet,
  FileDown,
  Eye,
  CheckCircle2,
  Calendar,
  Edit2,
  Trash2,
  X,
  SlidersHorizontal,
  BookOpen,
  UserCheck,
  RotateCcw,
  LayoutGrid,
  List,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { AsesoriaCard } from './AsesoriaCard';
import { useSimplifiedAdvisoryMode } from '../../hooks/useSimplifiedAdvisoryMode';
import {
  canAuthorizeOrAssign,
  canRegisterSeguimiento,
  isTeachingRole,
  getUserCarreraIds,
  userHasCarrera
} from '../../utils/roles';

const formatLocalDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

interface AsesoriasListProps {
  onSelectAdvisory: (id: string) => void;
  onOpenSeguimiento: (asesoria: Asesoria) => void;
  onOpenEditModal?: (asesoria: Asesoria) => void;
  onOpenAssignModal?: (asesoria: Asesoria) => void;
  isHistoryView?: boolean;
  initialEstado?: string;
  initialFecha?: string;
  initialCarrera?: string;
  presetKey?: number;
  refreshKey?: number;
}

export const AsesoriasList: React.FC<AsesoriasListProps> = ({
  onSelectAdvisory,
  onOpenSeguimiento,
  onOpenEditModal,
  onOpenAssignModal,
  isHistoryView = false,
  initialEstado,
  initialFecha = '',
  initialCarrera = 'all',
  presetKey = 0,
  refreshKey = 0
}) => {
  const { currentUser, currentRole } = useAuth();
  const defaultEstado = isHistoryView ? 'realizada' : 'all';

  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>(initialEstado || defaultEstado);
  const [filterFechaDesde, setFilterFechaDesde] = useState<string>(initialFecha || '');
  const [filterFechaHasta, setFilterFechaHasta] = useState<string>(initialFecha || '');
  const [filterCarrera, setFilterCarrera] = useState<string>(initialCarrera || 'all');
  const [filterDocente, setFilterDocente] = useState<string>('all');
  const [filterMateria, setFilterMateria] = useState<string>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const { isSimplified, setIsSimplified } = useSimplifiedAdvisoryMode();
  const [refreshTick, setRefreshTick] = useState(0);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<Asesoria | null>(null);

  useEffect(() => {
    setFilterEstado(initialEstado || (isHistoryView ? 'realizada' : 'all'));
    setFilterFechaDesde(initialFecha || '');
    setFilterFechaHasta(initialFecha || '');
    setFilterCarrera(initialCarrera || 'all');
    setFilterDocente('all');
    setFilterMateria('all');
  }, [initialEstado, initialFecha, initialCarrera, presetKey, isHistoryView]);

  void refreshKey;
  void refreshTick;

  const asesorias = SIAADataService.getAsesorias();
  const carreras = SIAADataService.getCarreras();
  const allMaterias = SIAADataService.getMaterias();
  const teachers = SIAADataService.getUsers().filter(u => isTeachingRole(u.rol));

  // Role filtering
  const userCarreras = getUserCarreraIds(currentUser);
  const availableCarreras =
    (currentRole === 'jefe_carrera' || currentRole === 'director') && userCarreras.length > 0
      ? carreras.filter(c => userCarreras.includes(c.id))
      : carreras;

  const availableMaterias = allMaterias.filter(m => {
    if (filterCarrera !== 'all') return m.carreraId === filterCarrera;
    if ((currentRole === 'jefe_carrera' || currentRole === 'director') && userCarreras.length > 0) {
      return userCarreras.includes(m.carreraId);
    }
    return true;
  });

  let scopedList = asesorias;
  if (currentRole === 'alumno') {
    scopedList = scopedList.filter(a => a.alumnoId === currentUser?.uid);
  } else if (isTeachingRole(currentRole)) {
    scopedList = scopedList.filter(a => a.docenteAsignadoId === currentUser?.uid);
  } else if ((currentRole === 'jefe_carrera' || currentRole === 'director') && userCarreras.length > 0) {
    scopedList = scopedList.filter(a => userHasCarrera(currentUser, a.carreraId));
  }

  // History view filtering: only completed/closed/cancelled
  if (isHistoryView) {
    scopedList = scopedList.filter(
      a => a.estado === 'realizada' || a.estado === 'cerrada' || a.estado === 'cancelada'
    );
  }

  let displayList = scopedList;

  // Search filter
  if (search.trim()) {
    const q = search.toLowerCase();
    displayList = displayList.filter(
      a =>
        a.folio.toLowerCase().includes(q) ||
        a.alumnoNombre.toLowerCase().includes(q) ||
        (a.docenteAsignadoNombre && a.docenteAsignadoNombre.toLowerCase().includes(q)) ||
        a.materiaNombre.toLowerCase().includes(q) ||
        a.materiaCodigo.toLowerCase().includes(q) ||
        a.matricula.toLowerCase().includes(q) ||
        (a.temasDificultad && a.temasDificultad.toLowerCase().includes(q)) ||
        (a.aulaNombre && a.aulaNombre.toLowerCase().includes(q))
    );
  }

  // State filter
  if (filterEstado === 'activas') {
    displayList = displayList.filter(
      a =>
        a.estado === 'aprobada' ||
        a.estado === 'asignada' ||
        a.estado === 'confirmada' ||
        a.estado === 'en_proceso'
    );
  } else if (filterEstado === 'sin_seguimiento') {
    displayList = displayList.filter(
      a =>
        a.estado === 'confirmada' ||
        a.estado === 'en_proceso' ||
        (a.estado === 'realizada' && !a.seguimiento)
    );
  } else if (filterEstado !== 'all') {
    displayList = displayList.filter(a => a.estado === filterEstado);
  }

  // Date range filter (uses fechaProgramada or falls back to fechaSolicitud if no programmed date when filtering ranges)
  if (filterFechaDesde || filterFechaHasta) {
    displayList = displayList.filter(a => {
      const targetDate = a.fechaProgramada;
      if (!targetDate) return false;
      if (filterFechaDesde && targetDate < filterFechaDesde) return false;
      if (filterFechaHasta && targetDate > filterFechaHasta) return false;
      return true;
    });
  }

  // Career filter
  if (filterCarrera !== 'all') {
    displayList = displayList.filter(a => a.carreraId === filterCarrera);
  }

  // Subject filter
  if (filterMateria !== 'all') {
    displayList = displayList.filter(a => a.materiaId === filterMateria);
  }

  // Teacher filter
  if (filterDocente === 'unassigned') {
    displayList = displayList.filter(a => !a.docenteAsignadoId);
  } else if (filterDocente !== 'all') {
    displayList = displayList.filter(a => a.docenteAsignadoId === filterDocente);
  }

  const todayStr = formatLocalDate(new Date());
  const applyDatePreset = (preset: 'today' | 'week' | 'month' | 'clear') => {
    const now = new Date();
    if (preset === 'clear') {
      setFilterFechaDesde('');
      setFilterFechaHasta('');
      return;
    }
    if (preset === 'today') {
      const d = formatLocalDate(now);
      setFilterFechaDesde(d);
      setFilterFechaHasta(d);
      return;
    }
    if (preset === 'week') {
      const day = now.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      setFilterFechaDesde(formatLocalDate(monday));
      setFilterFechaHasta(formatLocalDate(sunday));
      return;
    }
    if (preset === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setFilterFechaDesde(formatLocalDate(firstDay));
      setFilterFechaHasta(formatLocalDate(lastDay));
    }
  };

  const resetAllFilters = () => {
    setSearch('');
    setFilterEstado(defaultEstado);
    setFilterFechaDesde('');
    setFilterFechaHasta('');
    setFilterCarrera('all');
    setFilterDocente('all');
    setFilterMateria('all');
  };

  const advancedActiveCount = [
    filterDocente !== 'all',
    filterMateria !== 'all',
    filterCarrera !== 'all',
    Boolean(filterFechaDesde || filterFechaHasta)
  ].filter(Boolean).length;

  const hasAnyActiveFilter =
    Boolean(search.trim()) ||
    filterEstado !== defaultEstado ||
    advancedActiveCount > 0;

  const isExactTodayPreset = filterFechaDesde === todayStr && filterFechaHasta === todayStr;

  const handleExportExcel = () => {
    SIAADataService.exportToExcel(displayList, 'SIAA_Reporte_Asesorias');
  };

  const handleStatusChange = (id: string, newStatus: EstadoAsesoria) => {
    if (!currentUser) return;
    SIAADataService.updateAsesoriaEstado(
      id,
      newStatus,
      currentUser,
      `Actualización de estado manual a ${newStatus} desde el listado institucional.`
    );
    setRefreshTick(t => t + 1);
  };

  const handleDeleteAsesoria = () => {
    if (!confirmDeleteItem || !currentUser) return;
    SIAADataService.deleteAsesoria(confirmDeleteItem.id, currentUser);
    setConfirmDeleteItem(null);
    setRefreshTick(t => t + 1);
  };

  const isAdminOrDir = canAuthorizeOrAssign(currentRole);
  const isTeacher = isTeachingRole(currentRole);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 font-serif">
            {isHistoryView
              ? 'Historial de Asesorías Académicas'
              : currentRole === 'alumno'
              ? 'Mis Asesorías Académicas'
              : isTeacher
              ? 'Mis Asesorías Asignadas'
              : 'Control y Seguimiento de Asesorías'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isHistoryView
              ? 'Consulta de sesiones concluidas, folios cerrados y evaluaciones finales.'
              : 'Programación, asistencia, modificación, evaluación pedagógica y fichas oficiales de asesoría.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Simplified vs Detailed Toggle */}
          <div
            role="group"
            aria-label="Nivel de detalle en visualización"
            className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1"
          >
            <button
              type="button"
              onClick={() => setIsSimplified(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                isSimplified
                  ? 'bg-white dark:bg-slate-900 text-emerald-900 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Ocultar detalles técnicos para lectura ágil de docente y alumno"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              Simplificada
            </button>
            <button
              type="button"
              onClick={() => setIsSimplified(false)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                !isSimplified
                  ? 'bg-white dark:bg-slate-900 text-emerald-900 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Mostrar todos los folios, códigos, espacios y datos técnicos"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              Detallada
            </button>
          </div>

          {/* Cards vs Table Switcher */}
          <div
            role="group"
            aria-label="Formato de listado"
            className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1"
          >
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-900 text-emerald-900 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Tarjetas
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-emerald-900 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Tabla
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition-colors whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-400" />
            Exportar a Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* Advanced Search & Filter Bar */}
      <section
        aria-label="Barra de búsqueda y filtros avanzados"
        className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
      >
        {/* Top Search & Primary Controls Row */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              aria-label="Buscar asesorías"
              placeholder="Buscar por folio, alumno, matrícula, docente, materia o tema..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Limpiar búsqueda"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <select
              aria-label="Filtrar por estado"
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="text-xs px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700"
            >
              <option value="all">Todos los Estados</option>
              <option value="activas">Aprobadas / Programadas</option>
              <option value="sin_seguimiento">Pendientes de Seguimiento</option>
              <option value="confirmada">Confirmadas</option>
              <option value="en_proceso">En Proceso</option>
              <option value="realizada">Realizadas</option>
              <option value="cerrada">Cerradas</option>
              <option value="cancelada">Canceladas</option>
            </select>

            <button
              type="button"
              onClick={() => setShowAdvancedFilters(prev => !prev)}
              aria-expanded={showAdvancedFilters}
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                showAdvancedFilters || advancedActiveCount > 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-300'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filtros avanzados</span>
              {advancedActiveCount > 0 && (
                <span className="font-mono tabular-nums text-[11px] font-bold">
                  ({advancedActiveCount})
                </span>
              )}
            </button>

            {hasAnyActiveFilter && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0"
                title="Restablecer todos los filtros"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Advanced Filter Controls (Docente, Materia, Fecha, Carrera) */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
            {/* Docente Filter */}
            {!isTeacher && (
              <div className="lg:col-span-3">
                <label
                  htmlFor="filter-docente"
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1"
                >
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  Docente Asesor
                </label>
                <select
                  id="filter-docente"
                  value={filterDocente}
                  onChange={(e) => setFilterDocente(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700"
                >
                  <option value="all">Todos los Docentes</option>
                  <option value="unassigned">Sin docente asignado</option>
                  {teachers.map(t => (
                    <option key={t.uid} value={t.uid}>
                      {t.nombre} {t.apellidoPaterno} {t.apellidoMaterno}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Materia Filter */}
            <div className={isTeacher ? 'lg:col-span-4' : 'lg:col-span-3'}>
              <label
                htmlFor="filter-materia"
                className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1"
              >
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                Materia
              </label>
              <select
                id="filter-materia"
                value={filterMateria}
                onChange={(e) => setFilterMateria(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                <option value="all">Todas las Materias</option>
                {availableMaterias.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.codigo} · {m.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Carrera Filter */}
            <div className="lg:col-span-2">
              <label
                htmlFor="filter-carrera"
                className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1"
              >
                Carrera
              </label>
              <select
                id="filter-carrera"
                value={filterCarrera}
                onChange={(e) => {
                  const nextCarrera = e.target.value;
                  setFilterCarrera(nextCarrera);
                  if (nextCarrera !== 'all' && filterMateria !== 'all') {
                    const currentMat = allMaterias.find(m => m.id === filterMateria);
                    if (currentMat && currentMat.carreraId !== nextCarrera) {
                      setFilterMateria('all');
                    }
                  }
                }}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                <option value="all">Todas las Carreras</option>
                {availableCarreras.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.codigo}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filters */}
            <div className="lg:col-span-2">
              <label
                htmlFor="filter-fecha-desde"
                className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Fecha desde
              </label>
              <input
                id="filter-fecha-desde"
                type="date"
                value={filterFechaDesde}
                onChange={(e) => setFilterFechaDesde(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div className={isTeacher ? 'lg:col-span-4' : 'lg:col-span-2'}>
              <label
                htmlFor="filter-fecha-hasta"
                className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Fecha hasta
              </label>
              <input
                id="filter-fecha-hasta"
                type="date"
                value={filterFechaHasta}
                onChange={(e) => setFilterFechaHasta(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>
          </div>
        )}

        {/* Quick Date Presets & Live Result Counter */}
        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mr-1">
              Rango rápido:
            </span>
            <button
              type="button"
              onClick={() => applyDatePreset('today')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 ${
                isExactTodayPreset
                  ? 'bg-emerald-800 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => applyDatePreset('week')}
              className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
            >
              Esta semana
            </button>
            <button
              type="button"
              onClick={() => applyDatePreset('month')}
              className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
            >
              Este mes
            </button>
            {(filterFechaDesde || filterFechaHasta) && (
              <button
                type="button"
                onClick={() => applyDatePreset('clear')}
                className="px-2.5 py-1 rounded-md text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:underline whitespace-nowrap shrink-0"
              >
                Quitar fechas
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="tabular-nums">
              Mostrando <strong className="text-slate-800 dark:text-slate-100">{displayList.length}</strong> de{' '}
              <strong className="text-slate-800 dark:text-slate-100">{scopedList.length}</strong> asesorías
            </span>
            {(filterFechaDesde || filterFechaHasta) && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums text-amber-800 dark:text-amber-300">
                  {filterFechaDesde === filterFechaHasta
                    ? `Fecha: ${filterFechaDesde}`
                    : `${filterFechaDesde || 'Inicio'} → ${filterFechaHasta || 'Actual'}`}
                </span>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Main View: Cards Grid or Table */}
      {viewMode === 'cards' ? (
        displayList.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs px-6 py-12 text-center text-xs text-slate-500 dark:text-slate-400">
            <p>No se encontraron asesorías registradas con los filtros seleccionados.</p>
            {hasAnyActiveFilter && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restablecer filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {displayList.map(item => {
              const canEditBasic =
                isAdminOrDir ||
                (currentRole === 'alumno' &&
                  item.alumnoId === currentUser?.uid &&
                  (item.estado === 'pendiente' || item.estado === 'en_revision' || item.estado === 'rechazada'));
              const canReprogram =
                isAdminOrDir &&
                !!onOpenAssignModal &&
                (item.estado === 'aprobada' || item.estado === 'asignada' || item.estado === 'confirmada' || item.estado === 'en_proceso');
              const canDelete =
                isAdminOrDir ||
                (currentRole === 'alumno' &&
                  item.alumnoId === currentUser?.uid &&
                  (item.estado === 'pendiente' || item.estado === 'rechazada' || item.estado === 'cancelada'));
              const canFollowUp =
                canRegisterSeguimiento(currentRole) &&
                (item.estado === 'confirmada' || item.estado === 'en_proceso' || item.estado === 'realizada');
              const canClose = isAdminOrDir && item.estado === 'realizada';

              return (
                <AsesoriaCard
                  key={item.id}
                  item={item}
                  simplified={isSimplified}
                  onSelect={onSelectAdvisory}
                  onExportPDF={(a) => SIAADataService.exportFichaPDF(a)}
                  onEdit={onOpenEditModal}
                  onReprogram={onOpenAssignModal}
                  onSeguimiento={onOpenSeguimiento}
                  onCloseAdvisory={(id) => handleStatusChange(id, 'cerrada')}
                  onDelete={(a) => setConfirmDeleteItem(a)}
                  canEdit={Boolean(canEditBasic && onOpenEditModal)}
                  canReprogram={Boolean(canReprogram)}
                  canSeguimiento={canFollowUp}
                  canClose={canClose}
                  canDelete={canDelete}
                />
              );
            })}
          </div>
        )
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  {!isSimplified && <th className="px-4 py-3">Folio</th>}
                  <th className="px-4 py-3">Alumno</th>
                  <th className="px-4 py-3">Materia</th>
                  <th className="px-4 py-3">Docente Asesor</th>
                  <th className="px-4 py-3">Fecha y Horario</th>
                  {!isSimplified && <th className="px-4 py-3">Espacio</th>}
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {displayList.length === 0 ? (
                  <tr>
                    <td colSpan={isSimplified ? 6 : 8} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                      <p>No se encontraron asesorías registradas con los filtros seleccionados.</p>
                      {hasAnyActiveFilter && (
                        <button
                          type="button"
                          onClick={resetAllFilters}
                          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Restablecer filtros
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  displayList.map(item => {
                    const canEditBasic =
                      isAdminOrDir ||
                      (currentRole === 'alumno' &&
                        item.alumnoId === currentUser?.uid &&
                        (item.estado === 'pendiente' || item.estado === 'en_revision' || item.estado === 'rechazada'));
                    const canReprogram =
                      isAdminOrDir &&
                      onOpenAssignModal &&
                      (item.estado === 'aprobada' || item.estado === 'asignada' || item.estado === 'confirmada' || item.estado === 'en_proceso');
                    const canDelete =
                      isAdminOrDir ||
                      (currentRole === 'alumno' &&
                        item.alumnoId === currentUser?.uid &&
                        (item.estado === 'pendiente' || item.estado === 'rechazada' || item.estado === 'cancelada'));

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        {!isSimplified && (
                          <td className="px-4 py-3.5 font-mono font-bold text-emerald-950 dark:text-emerald-300">
                            {item.folio}
                          </td>
                        )}
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{item.alumnoNombre}</p>
                          {!isSimplified && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{item.matricula}</p>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-slate-800 dark:text-slate-200">{item.materiaNombre}</p>
                          {!isSimplified && (
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">{item.materiaCodigo}</p>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-slate-800 dark:text-slate-200">{item.docenteAsignadoNombre || 'Sin asignar'}</p>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <p className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums">{item.fechaProgramada || 'Por agendar'}</p>
                          {item.horaInicio && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">{item.horaInicio} - {item.horaTermino} hrs</p>
                          )}
                        </td>
                        {!isSimplified && (
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <p className="text-slate-700 dark:text-slate-200 font-medium">{item.aulaNombre || 'Aula asignada'}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 capitalize">{item.modalidad}</p>
                          </td>
                        )}
                        <td className="px-4 py-3.5">
                          <StatusBadge estado={item.estado} />
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => onSelectAdvisory(item.id)}
                              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-emerald-900 dark:hover:text-emerald-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                              title="Ver Ficha Completa"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => SIAADataService.exportFichaPDF(item)}
                              className="p-1.5 text-emerald-800 dark:text-emerald-400 hover:text-emerald-950 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-md transition-colors"
                              title="Descargar Ficha en PDF"
                            >
                              <FileDown className="w-4 h-4" />
                            </button>

                            {canEditBasic && onOpenEditModal && (
                              <button
                                type="button"
                                onClick={() => onOpenEditModal(item)}
                                className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-emerald-900 dark:hover:text-emerald-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                                title="Modificar datos de asesoría"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}

                            {canReprogram && (
                              <button
                                type="button"
                                onClick={() => onOpenAssignModal(item)}
                                className="p-1.5 text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-md transition-colors"
                                title="Modificar docente, horario o aula"
                              >
                                <Calendar className="w-4 h-4" />
                              </button>
                            )}

                            {/* Seguimiento trigger for teaching roles or admin */}
                            {canRegisterSeguimiento(currentRole) &&
                              (item.estado === 'confirmada' || item.estado === 'en_proceso' || item.estado === 'realizada') && (
                                <button
                                  type="button"
                                  onClick={() => onOpenSeguimiento(item)}
                                  className="px-2 py-1 bg-amber-500 text-emerald-950 font-bold rounded hover:bg-amber-400 flex items-center gap-1 shadow-2xs text-[11px]"
                                  title="Registrar o Editar Seguimiento"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  {item.seguimiento ? 'Editar Seg.' : 'Seguimiento'}
                                </button>
                              )}

                            {/* Direct status closing for Director or Admin */}
                            {isAdminOrDir &&
                              item.estado === 'realizada' && (
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(item.id, 'cerrada')}
                                  className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-semibold rounded hover:bg-emerald-200 dark:hover:bg-emerald-800/70 text-[11px]"
                                  title="Cerrar Asesoría en Sistema"
                                >
                                  Cerrar
                                </button>
                              )}

                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteItem(item)}
                                className="p-1.5 text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-md transition-colors"
                                title="Eliminar registro de asesoría"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!confirmDeleteItem}
        onClose={() => setConfirmDeleteItem(null)}
        onConfirm={handleDeleteAsesoria}
        title="¿Eliminar asesoría del sistema?"
        message={`Se eliminará permanentemente la asesoría ${confirmDeleteItem?.folio} (${confirmDeleteItem?.alumnoNombre} — ${confirmDeleteItem?.materiaNombre}).`}
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        variant="danger"
      />
    </div>
  );
};
