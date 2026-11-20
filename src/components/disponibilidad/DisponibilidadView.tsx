import React, { useState } from 'react';
import { SIAADataService } from '../../services/siaaService';
import { useAuth } from '../../context/AuthContext';
import { DisponibilidadRecurrente, DiaSemana, Modalidad } from '../../types/siaa';
import {
  Clock,
  PlusCircle,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Edit2,
  FileSpreadsheet
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { isTeachingRole, getRoleMeta } from '../../utils/roles';

interface DisponibilidadViewProps {
  onOpenBulkImport?: () => void;
}

export const DisponibilidadView: React.FC<DisponibilidadViewProps> = ({ onOpenBulkImport }) => {
  const { currentUser, currentRole } = useAuth();
  const allDocentes = SIAADataService.getUsers().filter(u => isTeachingRole(u.rol));
  const docentes =
    currentRole === 'jefe_carrera' && currentUser?.carreraId
      ? allDocentes.filter(d => !d.carreraId || d.carreraId === currentUser.carreraId)
      : allDocentes;

  const isTeacherSelf = isTeachingRole(currentRole);
  const canSwitchDocente = currentRole === 'admin' || currentRole === 'jefe_carrera';

  // If teaching role, lock to themselves. If admin/jefe_carrera, allow selecting teacher.
  const [selectedDocenteId, setSelectedDocenteId] = useState<string>(
    isTeacherSelf && currentUser ? currentUser.uid : (docentes[0]?.uid || '')
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [diaSemana, setDiaSemana] = useState<DiaSemana>('Lunes');
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [horaFin, setHoraFin] = useState('10:00');
  const [modalidad, setModalidad] = useState<Modalidad>('presencial');
  const [cupoMaximo, setCupoMaximo] = useState(3);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmDeleteSlot, setConfirmDeleteSlot] = useState<DisponibilidadRecurrente | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  void refreshTick;
  const disponibilidades = SIAADataService.getDisponibilidadesRecurrentes(selectedDocenteId);
  const selectedDocente = docentes.find(d => d.uid === selectedDocenteId);

  const dias: DiaSemana[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  const openCreateModal = () => {
    setEditingSlotId(null);
    setDiaSemana('Lunes');
    setHoraInicio('09:00');
    setHoraFin('10:00');
    setModalidad('presencial');
    setCupoMaximo(3);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (slot: DisponibilidadRecurrente) => {
    setEditingSlotId(slot.id);
    setDiaSemana(slot.diaSemana);
    setHoraInicio(slot.horaInicio);
    setHoraFin(slot.horaFin);
    setModalidad(slot.modalidad || 'presencial');
    setCupoMaximo(slot.cupoMaximo || 3);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSaveSlot = (e: React.FormEvent) => {
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

    // Check overlaps excluding the slot being edited
    const existing = disponibilidades.filter(
      d => d.diaSemana === diaSemana && d.activo !== false && d.id !== editingSlotId
    );
    const hasOverlap = existing.some(
      s => horaInicio < s.horaFin && horaFin > s.horaInicio
    );

    if (hasOverlap) {
      setErrorMsg(`Ya existe un bloque de disponibilidad configurado para el ${diaSemana} en este rango de horario.`);
      return;
    }

    if (editingSlotId) {
      SIAADataService.updateDisponibilidadRecurrente(editingSlotId, {
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

    setIsModalOpen(false);
    setRefreshTick(t => t + 1);
  };

  const handleConfirmDeleteSlot = () => {
    if (!confirmDeleteSlot) return;
    SIAADataService.deleteDisponibilidadRecurrente(confirmDeleteSlot.id);
    setConfirmDeleteSlot(null);
    setRefreshTick(t => t + 1);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 font-serif">
            {isTeacherSelf ? 'Mi Disponibilidad Semanal de Asesoría' : 'Gestión de Disponibilidad Docente'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configura, modifica o elimina los días, franjas horarias y cupos máximos para asesorías ({currentRole ? getRoleMeta(currentRole).label : ''}).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {canSwitchDocente && (
            <select
              value={selectedDocenteId}
              onChange={(e) => setSelectedDocenteId(e.target.value)}
              className="text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-emerald-700"
            >
              {docentes.map(d => (
                <option key={d.uid} value={d.uid}>
                  {d.nombre} {d.apellidoPaterno} ({getRoleMeta(d.rol).shortLabel})
                </option>
              ))}
            </select>
          )}
          {currentRole === 'admin' && onOpenBulkImport && (
            <button
              type="button"
              onClick={onOpenBulkImport}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              Plantilla / Carga Masiva
            </button>
          )}

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-amber-400" />
            Agregar Horario Disponible
          </button>
        </div>
      </div>

      {/* Schedule by Day Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dias.map(dia => {
          const slotsForDay = disponibilidades.filter(d => d.diaSemana === dia);
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
                          Modalidad: <span className="font-medium text-slate-700 dark:text-slate-200">{slot.modalidad}</span> • Cupo: <span className="font-medium text-slate-700 dark:text-slate-200">{slot.cupoMaximo} alumnos</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(slot)}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-emerald-900 dark:hover:text-emerald-300 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
                          title="Modificar bloque"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteSlot(slot)}
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

      {/* Add / Edit Slot Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSlotId ? 'Modificar Bloque de Disponibilidad Semanal' : 'Registrar Bloque de Disponibilidad Semanal'}
        subtitle={`Docente: ${selectedDocente?.nombre} ${selectedDocente?.apellidoPaterno}`}
        maxWidth="md"
      >
        <form onSubmit={handleSaveSlot} className="space-y-4 text-xs">
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
                Modalidad Preferente
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
                Cupo Máximo (Alumnos)
              </label>
              <input
                type="number"
                min={1}
                max={15}
                value={cupoMaximo}
                onChange={(e) => setCupoMaximo(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-semibold"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-900 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              {editingSlotId ? 'Guardar Cambios' : 'Guardar Disponibilidad'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDeleteSlot}
        onClose={() => setConfirmDeleteSlot(null)}
        onConfirm={handleConfirmDeleteSlot}
        title="¿Eliminar bloque de disponibilidad?"
        message={`Se eliminará el horario ${confirmDeleteSlot?.diaSemana} de ${confirmDeleteSlot?.horaInicio} a ${confirmDeleteSlot?.horaFin} hrs.`}
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        variant="danger"
      />
    </div>
  );
};
