import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { SIAADataService } from '../../services/siaaService';
import { Prioridad } from '../../types/siaa';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface SolicitudFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newId: string) => void;
}

export const SolicitudFormModal: React.FC<SolicitudFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { currentUser } = useAuth();
  const users = SIAADataService.getUsers();
  const materias = SIAADataService.getMaterias();
  const carreras = SIAADataService.getCarreras();
  const grupos = SIAADataService.getGrupos();
  const cuatrimestres = SIAADataService.getCuatrimestres();

  // If current user is student, auto select them. Otherwise allow selecting student.
  const isStudent = currentUser?.rol === 'alumno';
  const [selectedAlumnoId, setSelectedAlumnoId] = useState<string>(
    isStudent && currentUser ? currentUser.uid : (users.find(u => u.rol === 'alumno')?.uid || '')
  );

  const alumnoObj = users.find(u => u.uid === selectedAlumnoId);

  const [materiaId, setMateriaId] = useState<string>(materias[0]?.id || '');
  const [motivo, setMotivo] = useState<string>('');
  const [temasDificultad, setTemasDificultad] = useState<string>('');
  const [prioridad, setPrioridad] = useState<Prioridad>('media');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedMateria = materias.find(m => m.id === materiaId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedAlumnoId || !alumnoObj) {
      setErrorMsg('Debe seleccionar un alumno válido para la solicitud.');
      return;
    }

    if (!materiaId || !selectedMateria) {
      setErrorMsg('Debe seleccionar la materia en la que se solicita la asesoría.');
      return;
    }

    if (!motivo.trim()) {
      setErrorMsg('El motivo de la solicitud es obligatorio.');
      return;
    }

    if (!temasDificultad.trim()) {
      setErrorMsg('Debe especificar los temas específicos donde el alumno presenta dificultad.');
      return;
    }

    const carreraObj = carreras.find(c => c.id === alumnoObj.carreraId) || carreras[0];
    const grupoObj = grupos.find(g => g.id === alumnoObj.grupoId) || grupos[0];
    const cuatrimestreObj = cuatrimestres.find(c => c.id === alumnoObj.cuatrimestreId) || cuatrimestres[0];

    const newAsesoria = SIAADataService.createSolicitud({
      fechaSolicitud: new Date().toISOString().split('T')[0],
      alumnoId: alumnoObj.uid,
      alumnoNombre: `${alumnoObj.nombre} ${alumnoObj.apellidoPaterno} ${alumnoObj.apellidoMaterno}`,
      matricula: alumnoObj.matricula || 'S/M',
      carreraId: carreraObj.id,
      carreraNombre: carreraObj.nombre,
      grupoId: grupoObj.id,
      grupoNombre: grupoObj.nombre,
      cuatrimestreId: cuatrimestreObj.id,
      cuatrimestreNumero: cuatrimestreObj.numero,
      solicitanteId: currentUser?.uid || 'anonymous',
      solicitanteRol: currentUser?.rol || 'alumno',
      solicitanteNombre: currentUser ? `${currentUser.nombre} ${currentUser.apellidoPaterno}` : 'Usuario',
      materiaId: selectedMateria.id,
      materiaNombre: selectedMateria.nombre,
      materiaCodigo: selectedMateria.codigo,
      motivo: motivo.trim(),
      temasDificultad: temasDificultad.trim(),
      prioridad
    });

    onSuccess(newAsesoria.id);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nueva Solicitud de Asesoría Académica"
      subtitle="Complete los datos para generar el folio oficial de asesoría institucional"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="font-medium">{errorMsg}</p>
          </div>
        )}

        {/* Alumno Selector (Only if Admin, Director, or Teacher) */}
        {!isStudent ? (
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Alumno que recibirá la asesoría <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedAlumnoId}
              onChange={(e) => setSelectedAlumnoId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-700 font-medium"
            >
              {users.filter(u => u.rol === 'alumno' && u.estado === 'activo').map(alu => (
                <option key={alu.uid} value={alu.uid}>
                  {alu.nombre} {alu.apellidoPaterno} ({alu.matricula})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
            <p className="font-semibold text-xs">Alumno Solicitante:</p>
            <p className="text-sm font-bold">{currentUser?.nombre} {currentUser?.apellidoPaterno} {currentUser?.apellidoMaterno}</p>
            <p className="text-[11px] text-emerald-700">Matrícula: {currentUser?.matricula} | Correo: {currentUser?.correo}</p>
          </div>
        )}

        {/* Materia Selector */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Materia o Asignatura <span className="text-red-500">*</span>
          </label>
          <select
            value={materiaId}
            onChange={(e) => setMateriaId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-700 font-medium"
          >
            {materias.map(mat => (
              <option key={mat.id} value={mat.id}>
                [{mat.codigo}] {mat.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Prioridad */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Nivel de Prioridad o Urgencia
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['baja', 'media', 'alta', 'urgente'] as Prioridad[]).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPrioridad(p)}
                className={`py-2 px-3 rounded-lg border text-center capitalize font-semibold transition-colors ${
                  prioridad === p
                    ? 'bg-emerald-900 text-white border-emerald-900 shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Motivo de Asesoría */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Motivo de la Solicitud <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={2}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ejemplo: Dificultad para resolver problemas de aplicación en derivadas y reprobación de la primera evaluación parcial."
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-700"
          />
        </div>

        {/* Temas con Dificultad */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Temas Específicos con Dificultad de Aprendizaje <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={2}
            value={temasDificultad}
            onChange={(e) => setTemasDificultad(e.target.value)}
            placeholder="Ejemplo: Regla de la cadena, máximos y mínimos, optimización con funciones trigonométricas."
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-700"
          />
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 font-semibold rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-emerald-900 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-xs transition-colors flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4 text-amber-400" />
            Generar Solicitud
          </button>
        </div>
      </form>
    </Modal>
  );
};
