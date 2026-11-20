import React, { useState } from 'react';
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
  Trash2
} from 'lucide-react';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  canAuthorizeOrAssign,
  canRegisterSeguimiento,
  isTeachingRole
} from '../../utils/roles';

interface AsesoriasListProps {
  onSelectAdvisory: (id: string) => void;
  onOpenSeguimiento: (asesoria: Asesoria) => void;
  onOpenEditModal?: (asesoria: Asesoria) => void;
  onOpenAssignModal?: (asesoria: Asesoria) => void;
  isHistoryView?: boolean;
  refreshKey?: number;
}

export const AsesoriasList: React.FC<AsesoriasListProps> = ({
  onSelectAdvisory,
  onOpenSeguimiento,
  onOpenEditModal,
  onOpenAssignModal,
  isHistoryView = false,
  refreshKey = 0
}) => {
  const { currentUser, currentRole } = useAuth();
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>(isHistoryView ? 'realizada' : 'all');
  const [filterCarrera, setFilterCarrera] = useState<string>('all');
  const [filterDocente, setFilterDocente] = useState<string>('all');
  const [refreshTick, setRefreshTick] = useState(0);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<Asesoria | null>(null);

  void refreshKey;
  void refreshTick;

  const asesorias = SIAADataService.getAsesorias();
  const carreras = SIAADataService.getCarreras();
  const teachers = SIAADataService.getUsers().filter(u => isTeachingRole(u.rol));

  // Role filtering
  let displayList = asesorias;
  if (currentRole === 'alumno') {
    displayList = displayList.filter(a => a.alumnoId === currentUser?.uid);
  } else if (isTeachingRole(currentRole)) {
    displayList = displayList.filter(a => a.docenteAsignadoId === currentUser?.uid);
  } else if (currentRole === 'jefe_carrera' && currentUser?.carreraId) {
    displayList = displayList.filter(a => a.carreraId === currentUser.carreraId);
  }

  // History view filtering: only completed/closed/cancelled
  if (isHistoryView) {
    displayList = displayList.filter(
      a => a.estado === 'realizada' || a.estado === 'cerrada' || a.estado === 'cancelada'
    );
  }

  // Search filter
  if (search.trim()) {
    const q = search.toLowerCase();
    displayList = displayList.filter(
      a =>
        a.folio.toLowerCase().includes(q) ||
        a.alumnoNombre.toLowerCase().includes(q) ||
        (a.docenteAsignadoNombre && a.docenteAsignadoNombre.toLowerCase().includes(q)) ||
        a.materiaNombre.toLowerCase().includes(q) ||
        a.matricula.toLowerCase().includes(q)
    );
  }

  // State filter
  if (filterEstado !== 'all') {
    displayList = displayList.filter(a => a.estado === filterEstado);
  }

  // Career filter
  if (filterCarrera !== 'all') {
    displayList = displayList.filter(a => a.carreraId === filterCarrera);
  }

  // Teacher filter
  if (filterDocente !== 'all') {
    displayList = displayList.filter(a => a.docenteAsignadoId === filterDocente);
  }

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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-400" />
            Exportar a Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por folio, alumno, docente o materia..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium focus:ring-2 focus:ring-emerald-700"
            >
              <option value="all">Todos los Estados</option>
              <option value="confirmada">Confirmadas</option>
              <option value="en_proceso">En Proceso</option>
              <option value="realizada">Realizadas</option>
              <option value="cerrada">Cerradas</option>
              <option value="cancelada">Canceladas</option>
            </select>

            <select
              value={filterCarrera}
              onChange={(e) => setFilterCarrera(e.target.value)}
              className="text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium focus:ring-2 focus:ring-emerald-700"
            >
              <option value="all">Todas las Carreras</option>
              {carreras.map(c => (
                <option key={c.id} value={c.id}>{c.codigo}</option>
              ))}
            </select>

            {!isTeacher && (
              <select
                value={filterDocente}
                onChange={(e) => setFilterDocente(e.target.value)}
                className="text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium focus:ring-2 focus:ring-emerald-700"
              >
                <option value="all">Todos los Docentes</option>
                {teachers.map(t => (
                  <option key={t.uid} value={t.uid}>{t.nombre} {t.apellidoPaterno}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3">Folio</th>
                <th className="px-4 py-3">Alumno</th>
                <th className="px-4 py-3">Materia</th>
                <th className="px-4 py-3">Docente Asesor</th>
                <th className="px-4 py-3">Fecha y Horario</th>
                <th className="px-4 py-3">Espacio</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
                    No se encontraron asesorías registradas con los filtros seleccionados.
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
                      <td className="px-4 py-3.5 font-mono font-bold text-emerald-950 dark:text-emerald-300">
                        {item.folio}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{item.alumnoNombre}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{item.matricula}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-slate-800 dark:text-slate-200">{item.materiaNombre}</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">{item.materiaCodigo}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-slate-800 dark:text-slate-200">{item.docenteAsignadoNombre || 'Sin asignar'}</p>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="font-semibold text-slate-700 dark:text-slate-200">{item.fechaProgramada || 'Por agendar'}</p>
                        {item.horaInicio && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.horaInicio} - {item.horaTermino} hrs</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="text-slate-700 dark:text-slate-200 font-medium">{item.aulaNombre || 'Aula asignada'}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 capitalize">{item.modalidad}</p>
                      </td>
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
