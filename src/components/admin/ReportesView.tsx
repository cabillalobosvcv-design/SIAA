import React, { useState } from 'react';
import { SIAADataService } from '../../services/siaaService';
import { Asesoria } from '../../types/siaa';
import { StatusBadge } from '../common/StatusBadge';
import {
  FileSpreadsheet,
  FileDown,
  Filter,
  BarChart3,
  CheckCircle2,
  Users,
  GraduationCap,
  Calendar,
  Clock,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isTeachingRole } from '../../utils/roles';

export const ReportesView: React.FC = () => {
  const { currentUser, currentRole } = useAuth();
  const asesorias = SIAADataService.getAsesorias();
  const carreras = SIAADataService.getCarreras();
  const cuatrimestres = SIAADataService.getCuatrimestres();
  const docentes = SIAADataService.getUsers().filter(u => isTeachingRole(u.rol));

  const [selectedCarrera, setSelectedCarrera] = useState<string>(
    currentRole === 'jefe_carrera' && currentUser?.carreraId ? currentUser.carreraId : 'all'
  );
  const [selectedCuatrimestre, setSelectedCuatrimestre] = useState<string>('all');
  const [selectedDocente, setSelectedDocente] = useState<string>('all');
  const [selectedEstado, setSelectedEstado] = useState<string>('all');

  let filtered = asesorias;
  if (selectedCarrera !== 'all') {
    filtered = filtered.filter(a => a.carreraId === selectedCarrera);
  }
  if (selectedCuatrimestre !== 'all') {
    filtered = filtered.filter(a => a.cuatrimestreId === selectedCuatrimestre);
  }
  if (selectedDocente !== 'all') {
    filtered = filtered.filter(a => a.docenteAsignadoId === selectedDocente);
  }
  if (selectedEstado !== 'all') {
    filtered = filtered.filter(a => a.estado === selectedEstado);
  }

  // KPIs
  const totalAsesorias = filtered.length;
  const realizadas = filtered.filter(a => a.estado === 'realizada' || a.estado === 'cerrada').length;
  const satisfaccion = realizadas > 0
    ? Math.round(
        (filtered.filter(
          a => a.seguimiento?.resultado === 'satisfactorio' || a.seguimiento?.resultado === 'parcialmente_satisfactorio'
        ).length /
          realizadas) *
          100
      )
    : 100;
  const uniqueStudents = new Set(filtered.map(a => a.alumnoId)).size;
  const totalHoras = realizadas * 1; // 1 hour per session

  const handleExportExcel = () => {
    SIAADataService.exportToExcel(filtered, 'SIAA_Reporte_General_Asesorias');
  };

  const handleExportPDF = () => {
    SIAADataService.exportGeneralReportPDF(filtered, 'Reporte Institucional de Asesorías Académicas');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 uppercase tracking-wider">
            Módulo de Evaluación y Calidad Académica
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 font-serif">
            Reportes e Indicadores de Rendimiento
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Generación oficial de informes institucionales para auditoría, acreditaciones y Consejo Académico.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-emerald-900 hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-semibold text-xs shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-400" />
            Descargar Excel (.xlsx)
          </button>
          <button
            type="button"
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold text-xs shadow-xs transition-colors"
          >
            <FileDown className="w-4 h-4" />
            Descargar Informe PDF
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Total de Asesorías</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{totalAsesorias}</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">En el periodo seleccionado</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 uppercase">Sesiones Concluidas</p>
          <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-400 mt-1">{realizadas}</p>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-500 mt-0.5">Con seguimiento formal</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-teal-700 dark:text-teal-400 uppercase">Estudiantes Beneficiados</p>
          <p className="text-2xl font-bold text-teal-700 dark:text-teal-400 mt-1">{uniqueStudents}</p>
          <p className="text-[11px] text-teal-600 dark:text-teal-500 mt-0.5">Alumnos únicos atendidos</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase">Tasa de Aprobación</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{satisfaccion}%</p>
          <p className="text-[11px] text-amber-700 dark:text-amber-500 mt-0.5">Resultado pedagógico positivo</p>
        </div>
      </div>

      {/* Filter Parameters */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
          <Filter className="w-4 h-4 text-emerald-800 dark:text-emerald-400" />
          Parámetros y Filtros del Reporte
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Programa / Carrera</label>
            <select
              value={selectedCarrera}
              onChange={(e) => setSelectedCarrera(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200"
            >
              <option value="all">Todas las Carreras</option>
              {carreras.map(c => (
                <option key={c.id} value={c.id}>{c.codigo} - {c.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Cuatrimestre</label>
            <select
              value={selectedCuatrimestre}
              onChange={(e) => setSelectedCuatrimestre(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200"
            >
              <option value="all">Todos los Cuatrimestres</option>
              {cuatrimestres.map(cu => (
                <option key={cu.id} value={cu.id}>{cu.numero}° Cuatrimestre</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Docente Asesor</label>
            <select
              value={selectedDocente}
              onChange={(e) => setSelectedDocente(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200"
            >
              <option value="all">Todos los Docentes</option>
              {docentes.map(d => (
                <option key={d.uid} value={d.uid}>{d.nombre} {d.apellidoPaterno}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Estado de la Asesoría</label>
            <select
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200"
            >
              <option value="all">Todos los Estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="aprobada">Aprobadas</option>
              <option value="confirmada">Confirmadas</option>
              <option value="realizada">Realizadas</option>
              <option value="cerrada">Cerradas</option>
              <option value="cancelada">Canceladas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Report Data Preview Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Vista Previa de Registros Incluidos</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Mostrando {filtered.length} registros que serán exportados en los reportes.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Folio</th>
                <th className="px-4 py-3">Alumno</th>
                <th className="px-4 py-3">Carrera</th>
                <th className="px-4 py-3">Materia</th>
                <th className="px-4 py-3">Docente Asesor</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-emerald-950 dark:text-emerald-400">{item.folio}</td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{item.alumnoNombre}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{item.carreraNombre}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{item.materiaNombre}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{item.docenteAsignadoNombre || '--'}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{item.fechaProgramada || item.fechaSolicitud}</td>
                  <td className="px-4 py-3"><StatusBadge estado={item.estado} /></td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 capitalize">
                    {item.seguimiento ? item.seguimiento.resultado.replace('_', ' ') : 'Pendiente'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
