import React, { useState } from 'react';
import { SIAADataService } from '../../services/siaaService';
import { useAuth } from '../../context/AuthContext';
import { Asesoria, EstadoAsesoria, Prioridad } from '../../types/siaa';
import { StatusBadge, PriorityBadge } from '../common/StatusBadge';
import {
  Search,
  Filter,
  PlusCircle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Modal } from '../common/Modal';

interface SolicitudesListProps {
  onSelectAdvisory: (id: string) => void;
  onOpenNewModal: () => void;
  onOpenAssignModal: (asesoria: Asesoria) => void;
}

export const SolicitudesList: React.FC<SolicitudesListProps> = ({
  onSelectAdvisory,
  onOpenNewModal,
  onOpenAssignModal
}) => {
  const { currentUser, currentRole } = useAuth();
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [filterPrioridad, setFilterPrioridad] = useState<string>('all');

  // Authorization modal state
  const [authModalItem, setAuthModalItem] = useState<Asesoria | null>(null);
  const [authMode, setAuthMode] = useState<'aprobar' | 'rechazar'>('aprobar');
  const [authObservaciones, setAuthObservaciones] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const asesorias = SIAADataService.getAsesorias();

  // Role based filtering: Students only see their own requests
  let displayList = asesorias;
  if (currentRole === 'alumno') {
    displayList = displayList.filter(a => a.alumnoId === currentUser?.uid);
  }

  // Filter by search query
  if (search.trim()) {
    const q = search.toLowerCase();
    displayList = displayList.filter(
      a =>
        a.folio.toLowerCase().includes(q) ||
        a.alumnoNombre.toLowerCase().includes(q) ||
        a.matricula.toLowerCase().includes(q) ||
        a.materiaNombre.toLowerCase().includes(q)
    );
  }

  // Filter by estado
  if (filterEstado !== 'all') {
    displayList = displayList.filter(a => a.estado === filterEstado);
  }

  // Filter by prioridad
  if (filterPrioridad !== 'all') {
    displayList = displayList.filter(a => a.prioridad === filterPrioridad);
  }

  const handleAuthorizeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!authModalItem || !currentUser) return;

    if (authMode === 'rechazar' && !authObservaciones.trim()) {
      setAuthError('Debe especificar el motivo del rechazo.');
      return;
    }

    if (authMode === 'aprobar') {
      SIAADataService.autorizarSolicitud(authModalItem.id, currentUser, authObservaciones.trim());
    } else {
      SIAADataService.rechazarSolicitud(authModalItem.id, currentUser, authObservaciones.trim());
    }

    setAuthModalItem(null);
    setAuthObservaciones('');
  };

  const canAuthorize = currentRole === 'admin' || currentRole === 'director';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header & Actions */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif">
            {currentRole === 'alumno' ? 'Mis Solicitudes de Asesoría' : 'Gestión de Solicitudes Académicas'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Revisión, autorización, rechazo y asignación de folios institucionales para asesoría.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition-colors shrink-0"
        >
          <PlusCircle className="w-4 h-4 text-amber-400" />
          Nueva Solicitud
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por folio, matrícula, nombre del alumno o materia..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-700"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-emerald-700"
          >
            <option value="all">Todos los Estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="aprobada">Aprobadas</option>
            <option value="asignada">Asignadas</option>
            <option value="confirmada">Confirmadas</option>
            <option value="rechazada">Rechazadas</option>
            <option value="realizada">Realizadas</option>
            <option value="cerrada">Cerradas</option>
          </select>

          <select
            value={filterPrioridad}
            onChange={(e) => setFilterPrioridad(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-emerald-700"
          >
            <option value="all">Todas las Prioridades</option>
            <option value="urgente">Urgente</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Folio</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Alumno</th>
                <th className="px-4 py-3">Materia</th>
                <th className="px-4 py-3">Prioridad</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    No se encontraron solicitudes con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                displayList.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-emerald-950">
                      {a.folio}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                      {a.fechaSolicitud}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-slate-900">{a.alumnoNombre}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{a.matricula} • {a.grupoNombre}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-slate-800">{a.materiaNombre}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{a.materiaCodigo}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <PriorityBadge prioridad={a.prioridad} />
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge estado={a.estado} />
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectAdvisory(a.id)}
                          className="p-1.5 text-slate-600 hover:text-emerald-900 hover:bg-slate-100 rounded-md transition-colors"
                          title="Ver Ficha Detallada"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Authorization Actions (Admin, Director) */}
                        {canAuthorize && a.estado === 'pendiente' && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setAuthModalItem(a);
                                setAuthMode('aprobar');
                                setAuthObservaciones('');
                                setAuthError(null);
                              }}
                              className="px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded font-semibold hover:bg-emerald-100 flex items-center gap-1"
                              title="Autorizar Solicitud"
                            >
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                              Autorizar
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setAuthModalItem(a);
                                setAuthMode('rechazar');
                                setAuthObservaciones('');
                                setAuthError(null);
                              }}
                              className="px-2 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded font-semibold hover:bg-rose-100 flex items-center gap-1"
                              title="Rechazar Solicitud"
                            >
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              Rechazar
                            </button>
                          </>
                        )}

                        {/* Assignment Action */}
                        {canAuthorize &&
                          (a.estado === 'aprobada' || a.estado === 'asignada') && (
                            <button
                              type="button"
                              onClick={() => onOpenAssignModal(a)}
                              className="px-2 py-1 bg-amber-500 text-emerald-950 font-bold rounded hover:bg-amber-400 flex items-center gap-1 shadow-2xs"
                              title="Asignar Docente y Aula"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              Asignar
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Authorization / Rejection Modal */}
      {authModalItem && (
        <Modal
          isOpen={!!authModalItem}
          onClose={() => setAuthModalItem(null)}
          title={authMode === 'aprobar' ? `Autorizar Solicitud — ${authModalItem.folio}` : `Rechazar Solicitud — ${authModalItem.folio}`}
          subtitle={`Alumno: ${authModalItem.alumnoNombre} | Materia: ${authModalItem.materiaNombre}`}
          maxWidth="md"
        >
          <form onSubmit={handleAuthorizeSubmit} className="space-y-4 text-xs">
            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <p className="font-semibold">{authError}</p>
              </div>
            )}

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="font-semibold text-slate-700">Motivo declarado por el solicitante:</p>
              <p className="text-slate-600 mt-1 italic">"{authModalItem.motivo}"</p>
              <p className="font-semibold text-slate-700 mt-2">Temas específicos:</p>
              <p className="text-slate-600 italic">"{authModalItem.temasDificultad}"</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {authMode === 'aprobar'
                  ? 'Observaciones de Aprobación (Opcional)'
                  : 'Motivo del Rechazo de la Solicitud (Obligatorio) *'}
              </label>
              <textarea
                rows={3}
                value={authObservaciones}
                onChange={(e) => setAuthObservaciones(e.target.value)}
                placeholder={
                  authMode === 'aprobar'
                    ? 'Ejemplo: Aprobada para asignación de docente por riesgo de rezago académico.'
                    : 'Ejemplo: El alumno ya cuenta con asesoría activa en este tema o la materia no corresponde al cuatrimestre cursado.'
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setAuthModalItem(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`px-4 py-2 text-white font-bold rounded-lg shadow-xs ${
                  authMode === 'aprobar'
                    ? 'bg-emerald-800 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {authMode === 'aprobar' ? 'Confirmar Aprobación' : 'Confirmar Rechazo'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
