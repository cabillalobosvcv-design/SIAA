import React, { useState } from 'react';
import { SIAADataService } from '../../services/siaaService';
import { useAuth } from '../../context/AuthContext';
import { Asesoria, EstadoAsesoria } from '../../types/siaa';
import { StatusBadge, PriorityBadge } from '../common/StatusBadge';
import {
  Search,
  FileSpreadsheet,
  FileDown,
  Eye,
  CheckCircle2,
  Calendar,
  Clock,
  Filter,
  Layers,
  XCircle
} from 'lucide-react';

interface AsesoriasListProps {
  onSelectAdvisory: (id: string) => void;
  onOpenSeguimiento: (asesoria: Asesoria) => void;
  isHistoryView?: boolean;
}

export const AsesoriasList: React.FC<AsesoriasListProps> = ({
  onSelectAdvisory,
  onOpenSeguimiento,
  isHistoryView = false
}) => {
  const { currentUser, currentRole } = useAuth();
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>(isHistoryView ? 'realizada' : 'all');
  const [filterCarrera, setFilterCarrera] = useState<string>('all');
  const [filterDocente, setFilterDocente] = useState<string>('all');

  const asesorias = SIAADataService.getAsesorias();
  const carreras = SIAADataService.getCarreras();
  const teachers = SIAADataService.getUsers().filter(u => u.rol === 'docente');

  // Role filtering
  let displayList = asesorias;
  if (currentRole === 'alumno') {
    displayList = displayList.filter(a => a.alumnoId === currentUser?.uid);
  } else if (currentRole === 'docente') {
    displayList = displayList.filter(a => a.docenteAsignadoId === currentUser?.uid);
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
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif">
            {isHistoryView
              ? 'Historial de Asesorías Académicas'
              : currentRole === 'alumno'
              ? 'Mis Asesorías Académicas'
              : currentRole === 'docente'
              ? 'Mis Asesorías Asignadas'
              : 'Control y Seguimiento de Asesorías'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isHistoryView
              ? 'Consulta de sesiones concluidas, folios cerrados y evaluaciones finales.'
              : 'Programación, asistencia, evaluación pedagógica y fichas oficiales de asesoría.'}
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
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por folio, alumno, docente o materia..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-emerald-700"
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
              className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-emerald-700"
            >
              <option value="all">Todas las Carreras</option>
              {carreras.map(c => (
                <option key={c.id} value={c.id}>{c.codigo}</option>
              ))}
            </select>

            {currentRole !== 'docente' && (
              <select
                value={filterDocente}
                onChange={(e) => setFilterDocente(e.target.value)}
                className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-emerald-700"
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
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
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
            <tbody className="divide-y divide-slate-100">
              {displayList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    No se encontraron asesorías registradas con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                displayList.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-emerald-950">
                      {item.folio}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-slate-900">{item.alumnoNombre}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{item.matricula}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-slate-800">{item.materiaNombre}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{item.materiaCodigo}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-slate-800">{item.docenteAsignadoNombre || 'Sin asignar'}</p>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <p className="font-semibold text-slate-700">{item.fechaProgramada || 'Por agendar'}</p>
                      {item.horaInicio && (
                        <p className="text-[11px] text-slate-500">{item.horaInicio} - {item.horaTermino} hrs</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <p className="text-slate-700 font-medium">{item.aulaNombre || 'Aula asignada'}</p>
                      <p className="text-[10px] text-slate-400 capitalize">{item.modalidad}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge estado={item.estado} />
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectAdvisory(item.id)}
                          className="p-1.5 text-slate-600 hover:text-emerald-900 hover:bg-slate-100 rounded-md transition-colors"
                          title="Ver Ficha Completa"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => SIAADataService.exportFichaPDF(item)}
                          className="p-1.5 text-emerald-800 hover:text-emerald-950 hover:bg-emerald-50 rounded-md transition-colors"
                          title="Descargar Ficha en PDF"
                        >
                          <FileDown className="w-4 h-4" />
                        </button>

                        {/* Seguimiento trigger for teacher or admin */}
                        {(currentRole === 'docente' || currentRole === 'admin') &&
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
                        {(currentRole === 'admin' || currentRole === 'director') &&
                          item.estado === 'realizada' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(item.id, 'cerrada')}
                              className="px-2 py-1 bg-emerald-100 text-emerald-800 font-semibold rounded hover:bg-emerald-200 text-[11px]"
                              title="Cerrar Asesoría en Sistema"
                            >
                              Cerrar
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
    </div>
  );
};
