import React, { useState, useMemo } from 'react';
import { SIAADataService } from '../../services/siaaService';
import { useAuth } from '../../context/AuthContext';
import {
  DisponibilidadRecurrente,
  DisponibilidadEspecifica,
  DiaSemana,
  Modalidad
} from '../../types/siaa';
import {
  Clock,
  PlusCircle,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Edit2,
  FileSpreadsheet,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { isTeachingRole, getRoleMeta, getUserCarreraIds, userMatchesCareerScope } from '../../utils/roles';
import { downloadBulkTemplateXLSX } from '../../services/bulkImportService';

interface DisponibilidadViewProps {
  onOpenBulkImport?: () => void;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEK_HEADERS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export const DisponibilidadView: React.FC<DisponibilidadViewProps> = ({ onOpenBulkImport }) => {
  const { currentUser, currentRole } = useAuth();
  const carreras = SIAADataService.getCarreras();
  const userCarreras = getUserCarreraIds(currentUser);
  const allDocentes = SIAADataService.getUsers().filter(u => isTeachingRole(u.rol));
  const docentes =
    currentRole === 'jefe_carrera' && userCarreras.length > 0
      ? allDocentes.filter(d => userMatchesCareerScope(d, userCarreras))
      : allDocentes;

  const isTeacherSelf = isTeachingRole(currentRole);
  const canSwitchDocente = currentRole === 'admin' || currentRole === 'jefe_carrera';

  const [selectedDocenteId, setSelectedDocenteId] = useState<string>(
    isTeacherSelf && currentUser ? currentUser.uid : (docentes[0]?.uid || '')
  );

  // View mode: Calendar (by day & month) as primary, Weekly recurrent as secondary
  const [activeTab, setActiveTab] = useState<'calendario' | 'semanal'>('calendario');

  // Calendar Month & Year state
  const now = new Date();
  const [calYear, setCalYear] = useState<number>(now.getFullYear());
  const [calMonth, setCalMonth] = useState<number>(now.getMonth() + 1); // 1-12

  // Weekly Slot Modal state
  const [isWeeklyModalOpen, setIsWeeklyModalOpen] = useState(false);
  const [editingWeeklyId, setEditingWeeklyId] = useState<string | null>(null);
  const [diaSemana, setDiaSemana] = useState<DiaSemana>('Lunes');

  // Calendar (Day & Month) Modal state
  const [isCalModalOpen, setIsCalModalOpen] = useState(false);
  const [editingCalId, setEditingCalId] = useState<string | null>(null);
  const [calDiaInput, setCalDiaInput] = useState<number>(now.getDate());
  const [calMesInput, setCalMesInput] = useState<number>(now.getMonth() + 1);
  const [calAnioInput, setCalAnioInput] = useState<number>(now.getFullYear());

  // Shared slot form fields
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [horaFin, setHoraFin] = useState('10:00');
  const [modalidad, setModalidad] = useState<Modalidad>('presencial');
  const [cupoMaximo, setCupoMaximo] = useState(4);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Delete confirmations
  const [confirmDeleteWeekly, setConfirmDeleteWeekly] = useState<DisponibilidadRecurrente | null>(null);
  const [confirmDeleteCal, setConfirmDeleteCal] = useState<DisponibilidadEspecifica | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  void refreshTick;
  const disponibilidadesSemanales = SIAADataService.getDisponibilidadesRecurrentes(selectedDocenteId);
  const disponibilidadesCalendario = SIAADataService.getDisponibilidadesEspecificas(selectedDocenteId);
  const selectedDocente = docentes.find(d => d.uid === selectedDocenteId);

  const dias: DiaSemana[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const pad = (n: number) => String(n).padStart(2, '0');

  const currentMonthPrefix = `${calYear}-${pad(calMonth)}-`;
  const monthCalendarSlots = useMemo(() => {
    return disponibilidadesCalendario
      .filter(d => d.fecha.startsWith(currentMonthPrefix))
      .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.horaInicio.localeCompare(b.horaInicio));
  }, [disponibilidadesCalendario, currentMonthPrefix]);

  // Distinct months with registered slots for quick jump
  const monthsWithData = useMemo(() => {
    const seen = new Set<string>();
    disponibilidadesCalendario.forEach(d => {
      if (d.fecha && d.fecha.length >= 7) {
        seen.add(d.fecha.slice(0, 7));
      }
    });
    return Array.from(seen).sort();
  }, [disponibilidadesCalendario]);

  // Build calendar cells (Monday-first grid)
  const calendarCells = useMemo(() => {
    const firstDay = new Date(calYear, calMonth - 1, 1).getDay(); // 0=Sun..6=Sat
    const adjustedFirst = firstDay === 0 ? 6 : firstDay - 1;
    const totalDays = new Date(calYear, calMonth, 0).getDate();
    const cells: { day: number | null; fecha: string | null }[] = [];

    for (let i = 0; i < adjustedFirst; i++) {
      cells.push({ day: null, fecha: null });
    }
    for (let d = 1; d <= totalDays; d++) {
      cells.push({ day: d, fecha: `${calYear}-${pad(calMonth)}-${pad(d)}` });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ day: null, fecha: null });
    }
    return cells;
  }, [calYear, calMonth]);

  const handlePrevMonth = () => {
    if (calMonth === 1) {
      setCalMonth(12);
      setCalYear(y => y - 1);
    } else {
      setCalMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 12) {
      setCalMonth(1);
      setCalYear(y => y + 1);
    } else {
      setCalMonth(m => m + 1);
    }
  };

  // Calendar Create / Edit handlers
  const openCreateCalModal = (prefillDay?: number) => {
    setEditingCalId(null);
    setCalDiaInput(prefillDay ?? 1);
    setCalMesInput(calMonth);
    setCalAnioInput(calYear);
    setHoraInicio('09:00');
    setHoraFin('10:00');
    setModalidad('presencial');
    setCupoMaximo(4);
    setErrorMsg(null);
    setIsCalModalOpen(true);
  };

  const openEditCalModal = (slot: DisponibilidadEspecifica) => {
    const [yStr, mStr, dStr] = slot.fecha.split('-');
    setEditingCalId(slot.id);
    setCalAnioInput(Number(yStr) || calYear);
    setCalMesInput(Number(mStr) || calMonth);
    setCalDiaInput(Number(dStr) || 1);
    setHoraInicio(slot.horaInicio);
    setHoraFin(slot.horaFin);
    setModalidad(slot.modalidad || 'presencial');
    setCupoMaximo(slot.cupoMaximo ?? 4);
    setErrorMsg(null);
    setIsCalModalOpen(true);
  };

  const handleSaveCalSlot = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedDocenteId) {
      setErrorMsg('Debe seleccionar un docente.');
      return;
    }

    const testDate = new Date(calAnioInput, calMesInput - 1, calDiaInput);
    if (
      testDate.getFullYear() !== calAnioInput ||
      testDate.getMonth() !== calMesInput - 1 ||
      testDate.getDate() !== calDiaInput
    ) {
      setErrorMsg(`El día ${calDiaInput} no existe en ${MONTH_NAMES[calMesInput - 1]} ${calAnioInput}.`);
      return;
    }

    if (horaFin <= horaInicio) {
      setErrorMsg('La hora de fin debe ser posterior a la hora de inicio.');
      return;
    }

    const fechaIso = `${calAnioInput}-${pad(calMesInput)}-${pad(calDiaInput)}`;

    const existing = disponibilidadesCalendario.filter(
      d => d.fecha === fechaIso && d.activo !== false && d.id !== editingCalId
    );
    const hasOverlap = existing.some(s => horaInicio < s.horaFin && horaFin > s.horaInicio);
    if (hasOverlap) {
      setErrorMsg(`Ya existe un horario configurado para el ${pad(calDiaInput)}/${pad(calMesInput)}/${calAnioInput} en ese rango.`);
      return;
    }

    if (editingCalId) {
      SIAADataService.updateDisponibilidadEspecifica(editingCalId, {
        fecha: fechaIso,
        horaInicio,
        horaFin,
        modalidad,
        cupoMaximo,
        activo: true
      });
    } else {
      SIAADataService.addDisponibilidadEspecifica({
        docenteId: selectedDocenteId,
        fecha: fechaIso,
        horaInicio,
        horaFin,
        modalidad,
        cupoMaximo,
        activo: true
      });
    }

    setCalYear(calAnioInput);
    setCalMonth(calMesInput);
    setIsCalModalOpen(false);
    setRefreshTick(t => t + 1);
  };

  const handleConfirmDeleteCal = () => {
    if (!confirmDeleteCal) return;
    SIAADataService.deleteDisponibilidadEspecifica(confirmDeleteCal.id);
    setConfirmDeleteCal(null);
    setRefreshTick(t => t + 1);
  };

  // Weekly Create / Edit handlers
  const openCreateWeeklyModal = () => {
    setEditingWeeklyId(null);
    setDiaSemana('Lunes');
    setHoraInicio('09:00');
    setHoraFin('10:00');
    setModalidad('presencial');
    setCupoMaximo(4);
    setErrorMsg(null);
    setIsWeeklyModalOpen(true);
  };

  const openEditWeeklyModal = (slot: DisponibilidadRecurrente) => {
    setEditingWeeklyId(slot.id);
    setDiaSemana(slot.diaSemana);
    setHoraInicio(slot.horaInicio);
    setHoraFin(slot.horaFin);
    setModalidad(slot.modalidad || 'presencial');
    setCupoMaximo(slot.cupoMaximo || 4);
    setErrorMsg(null);
    setIsWeeklyModalOpen(true);
  };

  const handleSaveWeeklySlot = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (horaFin <= horaInicio) {
      setErrorMsg('La hora de fin debe ser posterior a la hora de inicio.');
      return;
    }

    if (!selectedDocenteId) {
      setErrorMsg('Debe seleccionar un docente.');
      return;
    }

    const existing = disponibilidadesSemanales.filter(
      d => d.diaSemana === diaSemana && d.activo !== false && d.id !== editingWeeklyId
    );
    const hasOverlap = existing.some(s => horaInicio < s.horaFin && horaFin > s.horaInicio);

    if (hasOverlap) {
      setErrorMsg(`Ya existe un bloque de disponibilidad configurado para el ${diaSemana} en este rango de horario.`);
      return;
    }

    if (editingWeeklyId) {
      SIAADataService.updateDisponibilidadRecurrente(editingWeeklyId, {
        diaSemana,
        horaInicio,
        horaFin,
        modalidad,
        cupoMaximo
      });
    } else {
      SIAADataService.addDisponibilidadRecurrente({
        docenteId: selectedDocenteId,
        diaSemana,
        horaInicio,
        horaFin,
        modalidad,
        cupoMaximo,
        activo: true
      });
    }

    setIsWeeklyModalOpen(false);
    setRefreshTick(t => t + 1);
  };

  const handleConfirmDeleteWeekly = () => {
    if (!confirmDeleteWeekly) return;
    SIAADataService.deleteDisponibilidadRecurrente(confirmDeleteWeekly.id);
    setConfirmDeleteWeekly(null);
    setRefreshTick(t => t + 1);
  };

  const formatCalendarDateLabel = (fecha: string) => {
    const [y, m, d] = fecha.split('-');
    const monthIdx = Number(m) - 1;
    const monthName = MONTH_NAMES[monthIdx] || m;
    return `${Number(d)} de ${monthName} ${y}`;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 font-serif">
            {isTeacherSelf ? 'Mi Disponibilidad de Asesoría' : 'Gestión de Disponibilidad Docente'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configura horarios por día y mes del calendario o por día recurrente semanal ({currentRole ? getRoleMeta(currentRole).label : ''}).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canSwitchDocente && (
            <select
              value={selectedDocenteId}
              onChange={(e) => setSelectedDocenteId(e.target.value)}
              className="text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-emerald-700"
            >
              {docentes.map(d => {
                const codes = getUserCarreraIds(d)
                  .map(id => carreras.find(c => c.id === id)?.codigo)
                  .filter(Boolean)
                  .join(', ');
                return (
                  <option key={d.uid} value={d.uid}>
                    {d.nombre} {d.apellidoPaterno} ({getRoleMeta(d.rol).shortLabel}{codes ? ` • ${codes}` : ''})
                  </option>
                );
              })}
            </select>
          )}

          <button
            type="button"
            onClick={() => downloadBulkTemplateXLSX('disponibilidad', false)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs transition-colors"
            title="Descargar archivo base Excel por día y mes"
          >
            <Download className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            Plantilla (.xlsx)
          </button>

          {currentRole === 'admin' && onOpenBulkImport && (
            <button
              type="button"
              onClick={onOpenBulkImport}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-semibold text-xs transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Carga Masiva
            </button>
          )}

          <button
            type="button"
            onClick={() => (activeTab === 'calendario' ? openCreateCalModal() : openCreateWeeklyModal())}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-amber-400" />
            {activeTab === 'calendario' ? 'Agregar Día y Horario' : 'Agregar Horario Semanal'}
          </button>
        </div>
      </div>

      {/* Tabs: Calendario por Día y Mes vs Horario Semanal */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('calendario')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'calendario'
                ? 'bg-emerald-900 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <CalendarDays className={`w-4 h-4 ${activeTab === 'calendario' ? 'text-amber-400' : ''}`} />
            Calendario por Día y Mes
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'calendario' ? 'bg-emerald-800 text-amber-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}>
              {disponibilidadesCalendario.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('semanal')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'semanal'
                ? 'bg-emerald-900 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Clock className={`w-4 h-4 ${activeTab === 'semanal' ? 'text-amber-400' : ''}`} />
            Horario Semanal Recurrente
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'semanal' ? 'bg-emerald-800 text-amber-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}>
              {disponibilidadesSemanales.length}
            </span>
          </button>
        </div>

        {activeTab === 'calendario' && monthsWithData.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 px-2 text-[11px]">
            <span className="text-slate-400 dark:text-slate-500 font-medium">Meses con horarios:</span>
            {monthsWithData.map(ym => {
              const [yStr, mStr] = ym.split('-');
              const yNum = Number(yStr);
              const mNum = Number(mStr);
              const isSelected = yNum === calYear && mNum === calMonth;
              return (
                <button
                  key={ym}
                  type="button"
                  onClick={() => {
                    setCalYear(yNum);
                    setCalMonth(mNum);
                  }}
                  className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                    isSelected
                      ? 'bg-emerald-900 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {MONTH_NAMES[mNum - 1]?.slice(0, 3)} {yNum}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* TAB 1: CALENDAR BY DAY & MONTH */}
      {activeTab === 'calendario' && (
        <div className="space-y-6">
          {/* Month / Year Controls */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Mes anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <select
                  value={calMonth}
                  onChange={(e) => setCalMonth(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100"
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={name} value={idx + 1}>{name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min={2020}
                  max={2100}
                  value={calYear}
                  onChange={(e) => setCalYear(Number(e.target.value) || now.getFullYear())}
                  className="w-20 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 text-center"
                />
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Mes siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Haz clic en cualquier día del calendario para agregar disponibilidad en ese día y mes.
              </p>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700">
              {WEEK_HEADERS.map(h => (
                <div key={h} className="py-2 text-center text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  {h}
                </div>
              ))}
            </div>

            {/* Calendar Day Grid */}
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-200 dark:divide-slate-800">
              {calendarCells.map((cell, idx) => {
                if (!cell.day || !cell.fecha) {
                  return <div key={`empty-${idx}`} className="min-h-[96px] bg-slate-50/50 dark:bg-slate-950/30" />;
                }
                const daySlots = monthCalendarSlots.filter(s => s.fecha === cell.fecha);
                return (
                  <div
                    key={cell.fecha}
                    className="min-h-[104px] p-2 bg-white dark:bg-slate-900 hover:bg-emerald-50/30 dark:hover:bg-slate-800/40 transition-colors flex flex-col"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs font-bold ${daySlots.length > 0 ? 'text-emerald-900 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>
                        {cell.day}
                      </span>
                      <button
                        type="button"
                        onClick={() => openCreateCalModal(cell.day ?? 1)}
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-900 hover:text-white transition-colors"
                        title={`Agregar horario el ${cell.day} de ${MONTH_NAMES[calMonth - 1]}`}
                      >
                        +
                      </button>
                    </div>

                    <div className="space-y-1 flex-1">
                      {daySlots.map(slot => (
                        <div
                          key={slot.id}
                          onClick={() => openEditCalModal(slot)}
                          className="cursor-pointer px-1.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[10px] text-emerald-950 dark:text-emerald-200 hover:border-emerald-500 transition-colors"
                          title="Clic para modificar este horario"
                        >
                          <p className="font-bold truncate">{slot.horaInicio} - {slot.horaFin}</p>
                          <p className="text-[9px] text-emerald-700 dark:text-emerald-400 capitalize truncate">
                            {slot.modalidad} • Cupo {slot.cupoMaximo ?? 4}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* List of registered slots for the selected month */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Horarios Programados en {MONTH_NAMES[calMonth - 1]} {calYear} ({monthCalendarSlots.length})
              </h2>
            </div>

            {monthCalendarSlots.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                No hay horarios específicos registrados en {MONTH_NAMES[calMonth - 1]} {calYear} para este docente.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {monthCalendarSlots.map(slot => (
                  <div
                    key={slot.id}
                    className="px-5 py-3 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                  >
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <span className="font-bold text-emerald-950 dark:text-emerald-200 bg-emerald-100/80 dark:bg-emerald-900/50 px-2.5 py-1 rounded">
                        {formatCalendarDateLabel(slot.fecha)}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                        {slot.horaInicio} - {slot.horaFin} hrs
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 capitalize">
                        Modalidad: <strong className="text-slate-700 dark:text-slate-200">{slot.modalidad}</strong> • Cupo: <strong className="text-slate-700 dark:text-slate-200">{slot.cupoMaximo ?? 4}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditCalModal(slot)}
                        className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-emerald-900 dark:hover:text-emerald-300 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
                        title="Modificar horario"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteCal(slot)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                        title="Eliminar horario"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: WEEKLY RECURRENT SCHEDULE */}
      {activeTab === 'semanal' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dias.map(dia => {
            const slotsForDay = disponibilidadesSemanales.filter(d => d.diaSemana === dia);
            return (
              <div key={dia} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col">
                <div className="bg-slate-50 dark:bg-slate-800/80 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{dia}</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                    {slotsForDay.length} {slotsForDay.length === 1 ? 'bloque' : 'bloques'}
                  </span>
                </div>

                <div className="p-4 flex-1 space-y-2">
                  {slotsForDay.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic py-4 text-center">
                      Sin horarios configurados
                    </p>
                  ) : (
                    slotsForDay.map(slot => (
                      <div
                        key={slot.id}
                        className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 flex items-center justify-between hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100 text-xs">
                            <Clock className="w-3.5 h-3.5 text-emerald-800 dark:text-emerald-400" />
                            <span>{slot.horaInicio} - {slot.horaFin} hrs</span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 capitalize">
                            Modalidad: <span className="font-medium text-slate-700 dark:text-slate-200">{slot.modalidad || 'presencial'}</span> • Cupo: <span className="font-medium text-slate-700 dark:text-slate-200">{slot.cupoMaximo ?? 4} alumnos</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditWeeklyModal(slot)}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-emerald-900 dark:hover:text-emerald-300 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
                            title="Modificar bloque"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteWeekly(slot)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                            title="Eliminar bloque"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal 1: Calendar Day & Month Availability */}
      <Modal
        isOpen={isCalModalOpen}
        onClose={() => setIsCalModalOpen(false)}
        title={editingCalId ? 'Modificar Disponibilidad por Día y Mes' : 'Registrar Disponibilidad por Día y Mes'}
        subtitle={`Docente: ${selectedDocente?.nombre || ''} ${selectedDocente?.apellidoPaterno || ''}`}
        maxWidth="md"
      >
        <form onSubmit={handleSaveCalSlot} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <p className="font-semibold">{errorMsg}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Día <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={31}
                value={calDiaInput}
                onChange={(e) => setCalDiaInput(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-semibold"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Mes <span className="text-red-500">*</span>
              </label>
              <select
                value={calMesInput}
                onChange={(e) => setCalMesInput(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-semibold"
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx + 1}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Año <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={2020}
                max={2100}
                value={calAnioInput}
                onChange={(e) => setCalAnioInput(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-semibold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Hora Inicio <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-semibold"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Hora Fin <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-semibold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Modalidad
              </label>
              <select
                value={modalidad}
                onChange={(e) => setModalidad(e.target.value as Modalidad)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-semibold capitalize"
              >
                <option value="presencial">Presencial</option>
                <option value="virtual">Virtual</option>
                <option value="hibrida">Híbrida</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Cupo (Alumnos)
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={cupoMaximo}
                onChange={(e) => setCupoMaximo(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-semibold"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsCalModalOpen(false)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-900 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              {editingCalId ? 'Guardar Cambios' : 'Guardar Horario'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Weekly Recurrent Slot */}
      <Modal
        isOpen={isWeeklyModalOpen}
        onClose={() => setIsWeeklyModalOpen(false)}
        title={editingWeeklyId ? 'Modificar Bloque Semanal' : 'Registrar Bloque Semanal'}
        subtitle={`Docente: ${selectedDocente?.nombre || ''} ${selectedDocente?.apellidoPaterno || ''}`}
        maxWidth="md"
      >
        <form onSubmit={handleSaveWeeklySlot} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <p className="font-semibold">{errorMsg}</p>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Día de la Semana <span className="text-red-500">*</span>
            </label>
            <select
              value={diaSemana}
              onChange={(e) => setDiaSemana(e.target.value as DiaSemana)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-semibold"
            >
              {dias.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Hora Inicio <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Hora Fin <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Modalidad
              </label>
              <select
                value={modalidad}
                onChange={(e) => setModalidad(e.target.value as Modalidad)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-semibold capitalize"
              >
                <option value="presencial">Presencial</option>
                <option value="virtual">Virtual</option>
                <option value="hibrida">Híbrida</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Cupo (Alumnos)
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={cupoMaximo}
                onChange={(e) => setCupoMaximo(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-semibold"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsWeeklyModalOpen(false)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-900 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              {editingWeeklyId ? 'Guardar Cambios' : 'Guardar Disponibilidad'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDeleteCal}
        onClose={() => setConfirmDeleteCal(null)}
        onConfirm={handleConfirmDeleteCal}
        title="¿Eliminar horario del calendario?"
        message={`Se eliminará el horario del ${confirmDeleteCal ? formatCalendarDateLabel(confirmDeleteCal.fecha) : ''} de ${confirmDeleteCal?.horaInicio} a ${confirmDeleteCal?.horaFin} hrs.`}
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={!!confirmDeleteWeekly}
        onClose={() => setConfirmDeleteWeekly(null)}
        onConfirm={handleConfirmDeleteWeekly}
        title="¿Eliminar bloque de disponibilidad?"
        message={`Se eliminará el horario ${confirmDeleteWeekly?.diaSemana} de ${confirmDeleteWeekly?.horaInicio} a ${confirmDeleteWeekly?.horaFin} hrs.`}
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        variant="danger"
      />
    </div>
  );
};
