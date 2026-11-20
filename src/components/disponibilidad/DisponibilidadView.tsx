import React, { useState } from 'react';
import { SIAADataService } from '../../services/siaaService';
import { useAuth } from '../../context/AuthContext';
import { DisponibilidadRecurrente, DiaSemana, Modalidad } from '../../types/siaa';
import {
  Clock,
  PlusCircle,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Layers,
  Calendar
} from 'lucide-react';
import { Modal } from '../common/Modal';

export const DisponibilidadView: React.FC = () => {
  const { currentUser, currentRole } = useAuth();
  const docentes = SIAADataService.getUsers().filter(u => u.rol === 'docente');

  // If docente, lock to themselves. If admin, allow selecting teacher.
  const [selectedDocenteId, setSelectedDocenteId] = useState<string>(
    currentRole === 'docente' && currentUser ? currentUser.uid : (docentes[0]?.uid || '')
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [diaSemana, setDiaSemana] = useState<DiaSemana>('Lunes');
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [horaFin, setHoraFin] = useState('10:00');
  const [modalidad, setModalidad] = useState<Modalidad>('presencial');
  const [cupoMaximo, setCupoMaximo] = useState(3);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const disponibilidades = SIAADataService.getDisponibilidadesRecurrentes(selectedDocenteId);
  const selectedDocente = docentes.find(d => d.uid === selectedDocenteId);

  const dias: DiaSemana[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  const handleAddSlot = (e: React.FormEvent) => {
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

    // Check overlaps
    const existing = disponibilidades.filter(d => d.diaSemana === diaSemana && d.activo);
    const hasOverlap = existing.some(
      s => (horaInicio < s.horaFin && horaFin > s.horaInicio)
    );

    if (hasOverlap) {
      setErrorMsg(`Ya existe un bloque de disponibilidad configurado para el ${diaSemana} en este rango de horario.`);
      return;
    }

    SIAADataService.addDisponibilidadRecurrente({
      docenteId: selectedDocenteId,
      diaSemana,
      horaInicio,
      horaFin,
      modalidad,
      cupoMaximo,
      activo: true
    });

    setIsModalOpen(false);
  };

  const handleDeleteSlot = (id: string) => {
    SIAADataService.deleteDisponibilidadRecurrente(id);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 font-serif">
            {currentRole === 'docente' ? 'Mi Disponibilidad Semanal de Asesoría' : 'Gestión de Disponibilidad Docente'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configura los días, franjas horarias y cupos máximos en que puedes atender a los alumnos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {currentRole === 'admin' && (
            <select
              value={selectedDocenteId}
              onChange={(e) => setSelectedDocenteId(e.target.value)}
              className="text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-emerald-700"
            >
              {docentes.map(d => (
                <option key={d.uid} value={d.uid}>{d.nombre} {d.apellidoPaterno}</option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => {
              setIsModalOpen(true);
              setErrorMsg(null);
            }}
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

                      <button
                        type="button"
                        onClick={() => handleDeleteSlot(slot.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                        title="Eliminar bloque"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Slot Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Bloque de Disponibilidad Semanal"
        subtitle={`Docente: ${selectedDocente?.nombre} ${selectedDocente?.apellidoPaterno}`}
        maxWidth="md"
      >
        <form onSubmit={handleAddSlot} className="space-y-4 text-xs">
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
              Guardar Disponibilidad
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
