import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Asesoria, Modalidad } from '../../types/siaa';
import { SIAADataService } from '../../services/siaaService';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, Calendar, Clock, DoorOpen, User, CheckCircle2 } from 'lucide-react';
import { isTeachingRole, getRoleMeta } from '../../utils/roles';

interface AsignacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  asesoria: Asesoria | null;
  onSuccess: () => void;
}

export const AsignacionModal: React.FC<AsignacionModalProps> = ({
  isOpen,
  onClose,
  asesoria,
  onSuccess
}) => {
  const { currentUser } = useAuth();
  const users = SIAADataService.getUsers();
  const aulas = SIAADataService.getAulas();

  // Teachers list (PTC Tutor, PA, Administrativo con Función Docente)
  const teachers = users.filter(u => isTeachingRole(u.rol) && u.estado === 'activo');

  const [selectedDocenteId, setSelectedDocenteId] = useState<string>('');
  const [fecha, setFecha] = useState<string>('');
  const [horaInicio, setHoraInicio] = useState<string>('10:00');
  const [horaTermino, setHoraTermino] = useState<string>('11:00'); // 60 min default (Requirement 12)
  const [selectedAulaId, setSelectedAulaId] = useState<string>('');
  const [modalidad, setModalidad] = useState<Modalidad>('presencial');
  const [observaciones, setObservaciones] = useState<string>('');
  const [conflictError, setConflictError] = useState<string | null>(null);

  // Initialize values when modal opens with asesoria
  useEffect(() => {
    if (asesoria) {
      setSelectedDocenteId(asesoria.docenteAsignadoId || (teachers[0]?.uid || ''));
      setSelectedAulaId(asesoria.aulaId || (aulas[0]?.id || ''));
      setModalidad(asesoria.modalidad || 'presencial');
      setObservaciones(asesoria.observaciones || '');
      setConflictError(null);

      // Default date to tomorrow if not set
      if (asesoria.fechaProgramada) {
        setFecha(asesoria.fechaProgramada);
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setFecha(tomorrow.toISOString().split('T')[0]);
      }

      if (asesoria.horaInicio) setHoraInicio(asesoria.horaInicio);
      if (asesoria.horaTermino) setHoraTermino(asesoria.horaTermino);
    }
  }, [asesoria, isOpen]);

  // Handle start time change to automatically set 60 minute duration (Requirement 12)
  const handleHoraInicioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHoraInicio(val);
    if (val) {
      const [h, m] = val.split(':').map(Number);
      const endH = (h + 1) % 24;
      const endStr = `${endH.toString().padStart(2, '0')}:${(m || 0).toString().padStart(2, '0')}`;
      setHoraTermino(endStr);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError(null);

    if (!asesoria || !currentUser) return;

    if (!selectedDocenteId) {
      setConflictError('Debe seleccionar un docente asesor.');
      return;
    }

    if (!fecha) {
      setConflictError('Debe seleccionar la fecha de la asesoría.');
      return;
    }

    if (!horaInicio || !horaTermino) {
      setConflictError('Debe indicar la hora de inicio y término.');
      return;
    }

    if (horaTermino <= horaInicio) {
      setConflictError('La hora de término debe ser posterior a la hora de inicio.');
      return;
    }

    // Attempt assignment with conflict check
    const result = SIAADataService.asignarAsesoria({
      asesoriaId: asesoria.id,
      docenteId: selectedDocenteId,
      fecha,
      horaInicio,
      horaTermino,
      aulaId: selectedAulaId,
      modalidad,
      observaciones,
      actor: currentUser
    });

    if (!result.success) {
      setConflictError(result.message || 'El horario seleccionado ya no está disponible. Seleccione otro horario.');
      return;
    }

    onSuccess();
    onClose();
  };

  if (!asesoria) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Asignación y Programación — ${asesoria.folio}`}
      subtitle="Defina el docente asesor, fecha, horario y aula institucional sin conflicto de agenda"
      maxWidth="2xl"
    >
      <form onSubmit={handleSave} className="space-y-4 text-xs">
        {conflictError && (
          <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Conflicto de Horario Detectado</p>
              <p className="mt-0.5">{conflictError}</p>
            </div>
          </div>
        )}

        {/* Advisory Context Card */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Alumno / Materia</p>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">{asesoria.alumnoNombre}</p>
            <p className="text-xs text-slate-600 dark:text-slate-300">{asesoria.materiaNombre} ({asesoria.materiaCodigo})</p>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/70 text-emerald-900 dark:text-emerald-200">
              {asesoria.matricula}
            </span>
          </div>
        </div>

        {/* Docente Selector */}
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
            <User className="w-4 h-4 text-emerald-800 dark:text-emerald-400" />
            Docente Asesor Especialista <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedDocenteId}
            onChange={(e) => setSelectedDocenteId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-700 font-medium"
          >
            {teachers.map(t => (
              <option key={t.uid} value={t.uid}>
                {t.nombre} {t.apellidoPaterno} {t.apellidoMaterno} — {getRoleMeta(t.rol).shortLabel} ({t.correo})
              </option>
            ))}
          </select>
        </div>

        {/* Fecha y Horario */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-800 dark:text-emerald-400" />
              Fecha Programada <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-700 font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-800 dark:text-emerald-400" />
              Hora Inicio (24h) <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              value={horaInicio}
              onChange={handleHoraInicioChange}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-700 font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              Hora Término (60 min) <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              value={horaTermino}
              onChange={(e) => setHoraTermino(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-700 font-medium"
            />
          </div>
        </div>

        {/* Aula y Modalidad */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
              <DoorOpen className="w-4 h-4 text-emerald-800 dark:text-emerald-400" />
              Aula o Laboratorio Asignado <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedAulaId}
              onChange={(e) => setSelectedAulaId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-700 font-medium"
            >
              {aulas.map(a => (
                <option key={a.id} value={a.id}>
                  {a.nombre} — {a.edificio} ({a.capacidad} pers.)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Modalidad de Atención <span className="text-red-500">*</span>
            </label>
            <select
              value={modalidad}
              onChange={(e) => setModalidad(e.target.value as Modalidad)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-700 font-medium capitalize"
            >
              <option value="presencial">Presencial (En Campus)</option>
              <option value="virtual">Virtual (Videoconferencia Institucional)</option>
              <option value="hibrida">Híbrida</option>
            </select>
          </div>
        </div>

        {/* Observaciones de Asignación */}
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
            Instrucciones u Observaciones para el Alumno y Docente
          </label>
          <input
            type="text"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Ejemplo: Traer apuntes de clase y ejercicios de guía de estudio resueltos hasta donde hubo dudas."
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-700"
          />
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-emerald-900 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-xs transition-colors flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            Confirmar y Asignar Asesoría
          </button>
        </div>
      </form>
    </Modal>
  );
};
