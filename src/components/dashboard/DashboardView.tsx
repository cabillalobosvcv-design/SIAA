import React, { useState } from 'react';
import {
  Users,
  GraduationCap,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  BookOpen,
  ArrowRight,
  PlusCircle,
  FileText,
  DoorOpen,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SIAADataService } from '../../services/siaaService';
import { StatusBadge, PriorityBadge } from '../common/StatusBadge';
import { Asesoria, UserRole } from '../../types/siaa';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface DashboardViewProps {
  onNavigate: (view: any) => void;
  onSelectAdvisory: (id: string) => void;
  onOpenSolicitudModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onSelectAdvisory,
  onOpenSolicitudModal
}) => {
  const { currentUser, currentRole } = useAuth();
  const asesorias = SIAADataService.getAsesorias();
  const users = SIAADataService.getUsers();
  const materias = SIAADataService.getMaterias();
  const carreras = SIAADataService.getCarreras();
  const aulas = SIAADataService.getAulas();

  // Filters for Director Dashboard
  const [selectedCarrera, setSelectedCarrera] = useState<string>('all');

  // ----------------------------------------------------
  // 1. DASHBOARD DEL ALUMNO (Requirement 39)
  // ----------------------------------------------------
  if (currentRole === 'alumno') {
    const misAsesorias = asesorias.filter(a => a.alumnoId === currentUser?.uid);
    const pendientes = misAsesorias.filter(a => a.estado === 'pendiente' || a.estado === 'en_revision');
    const proximas = misAsesorias.filter(a => a.estado === 'confirmada' || a.estado === 'asignada');
    const realizadas = misAsesorias.filter(a => a.estado === 'realizada' || a.estado === 'cerrada');

    // Find next upcoming
    const proximaAsesoria = proximas.sort((a, b) => {
      const dateA = a.fechaProgramada || '9999';
      const dateB = b.fechaProgramada || '9999';
      return dateA.localeCompare(dateB);
    })[0];

    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Welcome Hero Banner */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg border-b-4 border-amber-500 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Portal del Estudiante
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight">
              Bienvenido, {currentUser?.nombre} {currentUser?.apellidoPaterno}
            </h1>
            <p className="text-emerald-100/90 text-sm mt-2 leading-relaxed">
              Consulta el estatus de tus asesorías académicas, solicita apoyo con tus materias y da seguimiento a tus fichas de resultados.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onOpenSolicitudModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold text-sm shadow-md transition-all transform hover:-translate-y-0.5"
              >
                <PlusCircle className="w-4 h-4" />
                Solicitar Asesoría
              </button>
              <button
                type="button"
                onClick={() => onNavigate('asesorias')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition-colors"
              >
                Ver Mis Asesorías
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Counter KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Solicitudes Pendientes</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{pendientes.length}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Asesorías Próximas</p>
              <p className="text-2xl font-bold text-teal-700 mt-1">{proximas.length}</p>
            </div>
            <div className="p-3 bg-teal-50 rounded-xl text-teal-700">
              <Calendar className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Asesorías Realizadas</p>
              <p className="text-2xl font-bold text-emerald-800 mt-1">{realizadas.length}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-800">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Próxima Asesoría Destacada */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-800" />
              Próxima Asesoría Programada
            </h2>
            {proximaAsesoria && (
              <StatusBadge estado={proximaAsesoria.estado} />
            )}
          </div>

          <div className="p-6">
            {proximaAsesoria ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-xs text-slate-400 font-semibold uppercase block">Materia</span>
                    <p className="text-sm font-bold text-slate-800 mt-1">{proximaAsesoria.materiaNombre}</p>
                    <p className="text-xs text-slate-500 font-mono">{proximaAsesoria.materiaCodigo}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-xs text-slate-400 font-semibold uppercase block">Docente Asesor</span>
                    <p className="text-sm font-bold text-slate-800 mt-1">{proximaAsesoria.docenteAsignadoNombre || 'Por asignar'}</p>
                    <p className="text-xs text-emerald-700 font-medium">Asesor Especialista</p>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-xs text-slate-400 font-semibold uppercase block">Fecha y Horario</span>
                    <p className="text-sm font-bold text-slate-800 mt-1">{proximaAsesoria.fechaProgramada || 'Pendiente'}</p>
                    <p className="text-xs text-slate-600">{proximaAsesoria.horaInicio} - {proximaAsesoria.horaTermino} hrs</p>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-xs text-slate-400 font-semibold uppercase block">Lugar / Modalidad</span>
                    <p className="text-sm font-bold text-slate-800 mt-1">{proximaAsesoria.aulaNombre || 'Aula asignada'}</p>
                    <p className="text-xs text-slate-500 capitalize">{proximaAsesoria.modalidad || 'Presencial'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">Temas a trabajar:</span> {proximaAsesoria.temasDificultad}
                  </p>
                  <button
                    type="button"
                    onClick={() => onSelectAdvisory(proximaAsesoria.id)}
                    className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 flex items-center gap-1 hover:underline"
                  >
                    Ver detalle completo
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-700">No tienes asesorías próximas confirmadas</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Si presentas dificultades en alguna materia de tu cuatrimestre, puedes generar una nueva solicitud de asesoría en cualquier momento.
                </p>
                <button
                  type="button"
                  onClick={onOpenSolicitudModal}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs"
                >
                  <PlusCircle className="w-4 h-4" />
                  Solicitar una asesoría ahora
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recent History Table Preview */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Historial Reciente de Asesorías</h2>
            <button
              type="button"
              onClick={() => onNavigate('historial')}
              className="text-xs font-semibold text-emerald-800 hover:underline"
            >
              Ver todo el historial
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Folio</th>
                  <th className="px-4 py-3">Materia</th>
                  <th className="px-4 py-3">Docente</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {misAsesorias.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                      No has solicitado ninguna asesoría hasta el momento.
                    </td>
                  </tr>
                ) : (
                  misAsesorias.slice(0, 5).map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-slate-800">{item.folio}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{item.materiaNombre}</td>
                      <td className="px-4 py-3 text-slate-600">{item.docenteAsignadoNombre || 'Por asignar'}</td>
                      <td className="px-4 py-3 text-slate-500">{item.fechaProgramada || item.fechaSolicitud}</td>
                      <td className="px-4 py-3"><StatusBadge estado={item.estado} /></td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => onSelectAdvisory(item.id)}
                          className="text-emerald-800 font-semibold hover:underline"
                        >
                          Ver ficha
                        </button>
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
  }

  // ----------------------------------------------------
  // 2. DASHBOARD DEL DOCENTE (Requirement 40)
  // ----------------------------------------------------
  if (currentRole === 'docente') {
    const misAsesorias = asesorias.filter(a => a.docenteAsignadoId === currentUser?.uid);
    const todayStr = new Date().toISOString().split('T')[0];
    const hoy = misAsesorias.filter(a => a.fechaProgramada === todayStr && (a.estado === 'confirmada' || a.estado === 'asignada' || a.estado === 'en_proceso'));
    const proximas = misAsesorias.filter(a => (a.fechaProgramada || '') >= todayStr && a.fechaProgramada !== todayStr && (a.estado === 'confirmada' || a.estado === 'asignada'));
    const realizadas = misAsesorias.filter(a => a.estado === 'realizada' || a.estado === 'cerrada');
    const dispRecurrentes = SIAADataService.getDisponibilidadesRecurrentes(currentUser?.uid);

    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Header Hero */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Panel del Docente Asesor
            </span>
            <h1 className="text-2xl font-bold text-slate-900 mt-2 font-serif">
              {currentUser?.nombre} {currentUser?.apellidoPaterno}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              No. Empleado: <span className="font-mono font-medium">{currentUser?.numeroEmpleado}</span> | {currentUser?.correo}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('disponibilidad')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition-colors"
            >
              <Clock className="w-4 h-4 text-amber-400" />
              Configurar Disponibilidad
            </button>
            <button
              type="button"
              onClick={() => onNavigate('calendario')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            >
              <Calendar className="w-4 h-4 text-slate-500" />
              Mi Calendario
            </button>
          </div>
        </div>

        {/* Counter KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <p className="text-xs font-semibold text-slate-500 uppercase">Asesorías de Hoy</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-bold text-amber-700">{hoy.length}</span>
              <span className="p-2.5 bg-amber-50 rounded-lg text-amber-700"><Clock className="w-5 h-5" /></span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <p className="text-xs font-semibold text-slate-500 uppercase">Próximas Sesiones</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-bold text-teal-700">{proximas.length}</span>
              <span className="p-2.5 bg-teal-50 rounded-lg text-teal-700"><Calendar className="w-5 h-5" /></span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <p className="text-xs font-semibold text-slate-500 uppercase">Asesorías Realizadas</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-bold text-emerald-800">{realizadas.length}</span>
              <span className="p-2.5 bg-emerald-50 rounded-lg text-emerald-800"><CheckCircle2 className="w-5 h-5" /></span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <p className="text-xs font-semibold text-slate-500 uppercase">Horarios Registrados</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-bold text-slate-800">{dispRecurrentes.length}</span>
              <span className="p-2.5 bg-slate-100 rounded-lg text-slate-700"><Layers className="w-5 h-5" /></span>
            </div>
          </div>
        </div>

        {/* Asesorías de hoy / próximas list */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hoy & Urgentes */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                Asesorías de Hoy / En Curso
              </h2>
              <span className="text-xs text-slate-400 font-medium">Fecha: {todayStr}</span>
            </div>

            {hoy.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                No tienes sesiones de asesoría programadas para el día de hoy.
              </div>
            ) : (
              <div className="space-y-3">
                {hoy.map(item => (
                  <div key={item.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-900">{item.folio}</span>
                        <span className="text-xs font-bold text-slate-800">{item.materiaNombre}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Alumno: <span className="font-semibold">{item.alumnoNombre}</span> ({item.matricula})
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {item.horaInicio} - {item.horaTermino} hrs | Aula: {item.aulaNombre}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectAdvisory(item.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-800 text-white text-xs font-semibold hover:bg-emerald-700"
                    >
                      Registrar Resultado
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Próximas Asignadas */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-700" />
                Próximas Sesiones Asignadas
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('asesorias')}
                className="text-xs text-emerald-800 font-semibold hover:underline"
              >
                Ver todas
              </button>
            </div>

            {proximas.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                No hay asesorías próximas programadas en tu agenda.
              </div>
            ) : (
              <div className="space-y-3">
                {proximas.slice(0, 4).map(item => (
                  <div key={item.id} className="p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{item.materiaNombre}</p>
                      <p className="text-xs text-slate-500">
                        {item.alumnoNombre} • {item.fechaProgramada} ({item.horaInicio} - {item.horaTermino})
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectAdvisory(item.id)}
                      className="text-xs text-emerald-800 font-semibold hover:underline"
                    >
                      Ver Ficha
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 3. DASHBOARD DEL DIRECTIVO ACADÉMICO (Requirement 41)
  // ----------------------------------------------------
  if (currentRole === 'director') {
    const filteredByCarrera = selectedCarrera === 'all'
      ? asesorias
      : asesorias.filter(a => a.carreraId === selectedCarrera);

    const totalAlumnos = users.filter(u => u.rol === 'alumno' && u.estado === 'activo').length;
    const totalDocentes = users.filter(u => u.rol === 'docente' && u.estado === 'activo').length;
    const pendientes = filteredByCarrera.filter(a => a.estado === 'pendiente' || a.estado === 'en_revision');
    const aprobadas = filteredByCarrera.filter(a => a.estado === 'aprobada' || a.estado === 'confirmada');
    const realizadas = filteredByCarrera.filter(a => a.estado === 'realizada' || a.estado === 'cerrada');

    // Chart data: Asesorías por Materia
    const materiaCounts: Record<string, number> = {};
    filteredByCarrera.forEach(a => {
      materiaCounts[a.materiaNombre] = (materiaCounts[a.materiaNombre] || 0) + 1;
    });
    const dataMaterias = Object.entries(materiaCounts).map(([name, count]) => ({
      name: name.length > 18 ? name.slice(0, 18) + '...' : name,
      total: count
    }));

    // Chart data: Asesorías por Estado
    const estadoCounts: Record<string, number> = {};
    filteredByCarrera.forEach(a => {
      estadoCounts[a.estado] = (estadoCounts[a.estado] || 0) + 1;
    });
    const COLORS = ['#0f766e', '#d97706', '#2563eb', '#16a34a', '#e11d48', '#64748b'];
    const dataEstados = Object.entries(estadoCounts).map(([name, value]) => ({
      name: name.toUpperCase().replace('_', ' '),
      value
    }));

    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Header with Period & Career Filters */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Dirección de Asuntos Académicos
            </span>
            <h1 className="text-2xl font-bold text-slate-900 mt-2 font-serif">
              Indicadores Académicos y Cumplimiento
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Supervisión de rezago pedagógico, asesorías preventivas y desempeño institucional.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedCarrera}
              onChange={(e) => setSelectedCarrera(e.target.value)}
              className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-emerald-700"
            >
              <option value="all">Todas las Carreras</option>
              {carreras.map(c => (
                <option key={c.id} value={c.id}>{c.codigo} - {c.nombre}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => onNavigate('reportes')}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-900 text-white rounded-lg text-xs font-semibold hover:bg-emerald-800 shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-400" />
              Generar Reporte
            </button>
          </div>
        </div>

        {/* Executive Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <p className="text-xs font-semibold text-slate-500 uppercase">Alumnos Registrados</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalAlumnos}</p>
            <p className="text-[11px] text-emerald-700 mt-1 font-medium">Padrón activo</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <p className="text-xs font-semibold text-slate-500 uppercase">Docentes Asesores</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalDocentes}</p>
            <p className="text-[11px] text-emerald-700 mt-1 font-medium">Claustro académico</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <p className="text-xs font-semibold text-slate-500 uppercase">Pendientes Revisión</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{pendientes.length}</p>
            <p className="text-[11px] text-amber-700 mt-1 font-medium">Por autorizar</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <p className="text-xs font-semibold text-slate-500 uppercase">Aprobadas / Agendadas</p>
            <p className="text-2xl font-bold text-teal-700 mt-1">{aprobadas.length}</p>
            <p className="text-[11px] text-teal-700 mt-1 font-medium">En proceso de atención</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <p className="text-xs font-semibold text-slate-500 uppercase">Realizadas y Cerradas</p>
            <p className="text-2xl font-bold text-emerald-800 mt-1">{realizadas.length}</p>
            <p className="text-[11px] text-emerald-700 mt-1 font-medium">Con seguimiento formal</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Materias con mayor demanda */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4">
              Materias con Mayor Demanda de Asesoría
            </h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataMaterias} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', fontSize: '12px', border: '1px solid #cbd5e1' }} />
                  <Bar dataKey="total" fill="#0f766e" radius={[4, 4, 0, 0]} name="Asesorías" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Estado de las asesorías */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4">
              Distribución por Estado de Solicitudes
            </h2>
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataEstados}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {dataEstados.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 4. DASHBOARD DEL ADMINISTRADOR (Requirement 42)
  // ----------------------------------------------------
  const totalAlumnos = users.filter(u => u.rol === 'alumno').length;
  const totalDocentes = users.filter(u => u.rol === 'docente').length;
  const totalDirectivos = users.filter(u => u.rol === 'director').length;
  const solicitudesPendientes = asesorias.filter(a => a.estado === 'pendiente' || a.estado === 'en_revision').length;
  const asesoriasAprobadas = asesorias.filter(a => a.estado === 'aprobada' || a.estado === 'asignada' || a.estado === 'confirmada').length;
  const asesoriasRealizadas = asesorias.filter(a => a.estado === 'realizada' || a.estado === 'cerrada').length;
  const asesoriasCanceladas = asesorias.filter(a => a.estado === 'cancelada' || a.estado === 'rechazada').length;
  
  // Alumnos únicos atendidos
  const uniqueStudents = new Set(asesorias.filter(a => a.estado === 'realizada' || a.estado === 'cerrada').map(a => a.alumnoId)).size;

  // Chart data: Por carrera
  const carreraCounts: Record<string, number> = {};
  asesorias.forEach(a => {
    const c = carreras.find(car => car.id === a.carreraId);
    const label = c ? c.codigo : 'Otra';
    carreraCounts[label] = (carreraCounts[label] || 0) + 1;
  });
  const dataCarreras = Object.entries(carreraCounts).map(([name, total]) => ({ name, total }));

  // Chart data: Por docente
  const docenteCounts: Record<string, number> = {};
  asesorias.forEach(a => {
    if (a.docenteAsignadoNombre) {
      docenteCounts[a.docenteAsignadoNombre.split(' ')[0] + ' ' + (a.docenteAsignadoNombre.split(' ')[1] || '')] =
        (docenteCounts[a.docenteAsignadoNombre.split(' ')[0] + ' ' + (a.docenteAsignadoNombre.split(' ')[1] || '')] || 0) + 1;
    }
  });
  const dataDocentes = Object.entries(docenteCounts).map(([name, total]) => ({ name, total }));

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Admin Title & Quick Navigation Shortcuts */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 uppercase tracking-wider">
            Administración General del Sistema
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-2 font-serif">
            Panel de Control Institucional
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestión integral de usuarios, catálogos, horarios, asesorías e indicadores universitarios.
          </p>
        </div>

        {/* Quick Actions (Requirement 42) */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('usuarios')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-slate-500" />
            Crear Usuario
          </button>
          <button
            type="button"
            onClick={() => onNavigate('materias')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-500" />
            Crear Materia
          </button>
          <button
            type="button"
            onClick={() => onNavigate('disponibilidad')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            Registrar Disponibilidad
          </button>
          <button
            type="button"
            onClick={() => onNavigate('solicitudes')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-emerald-950 text-xs font-bold shadow-xs transition-colors"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            Revisar Solicitudes
          </button>
        </div>
      </div>

      {/* Metrics Cards (Requirement 21 & 42) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Total Alumnos</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalAlumnos}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Total Docentes</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalDocentes}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-amber-700 uppercase">Solicitudes Pend.</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{solicitudesPendientes}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-teal-700 uppercase">Aprobadas/Prog.</p>
          <p className="text-2xl font-bold text-teal-700 mt-1">{asesoriasAprobadas}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-emerald-800 uppercase">Realizadas</p>
          <p className="text-2xl font-bold text-emerald-800 mt-1">{asesoriasRealizadas}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-rose-700 uppercase">Canceladas</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">{asesoriasCanceladas}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Alumnos Atendidos</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{uniqueStudents}</p>
        </div>
      </div>

      {/* Visual Charts (Requirement 21) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asesorías por Carrera */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
          <h2 className="text-base font-bold text-slate-900 mb-4">
            Demanda de Asesorías por Programa Educativo
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataCarreras} margin={{ top: 10, right: 20, left: -20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="total" fill="#0f766e" radius={[4, 4, 0, 0]} name="Asesorías" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asesorías por Docente Asesor */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
          <h2 className="text-base font-bold text-slate-900 mb-4">
            Asesorías Impartidas por Docente Asesor
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataDocentes} margin={{ top: 10, right: 20, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="total" fill="#d97706" radius={[4, 4, 0, 0]} name="Asesorías Atendidas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Solicitudes Pendientes para Atención Rápida */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            Solicitudes que Requieren Atención Inmediata
          </h2>
          <button
            type="button"
            onClick={() => onNavigate('solicitudes')}
            className="text-xs font-semibold text-emerald-800 hover:underline"
          >
            Gestionar todas las solicitudes
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Folio</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Alumno</th>
                <th className="px-4 py-3">Materia</th>
                <th className="px-4 py-3">Prioridad</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {asesorias.filter(a => a.estado === 'pendiente' || a.estado === 'aprobada').length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                    No hay solicitudes pendientes en este momento.
                  </td>
                </tr>
              ) : (
                asesorias
                  .filter(a => a.estado === 'pendiente' || a.estado === 'aprobada')
                  .slice(0, 5)
                  .map(a => (
                    <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-slate-800">{a.folio}</td>
                      <td className="px-4 py-3 text-slate-500">{a.fechaSolicitud}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{a.alumnoNombre}</td>
                      <td className="px-4 py-3 text-slate-700">{a.materiaNombre}</td>
                      <td className="px-4 py-3"><PriorityBadge prioridad={a.prioridad} /></td>
                      <td className="px-4 py-3"><StatusBadge estado={a.estado} /></td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => onSelectAdvisory(a.id)}
                          className="px-3 py-1 bg-emerald-800 text-white rounded text-xs font-semibold hover:bg-emerald-700 shadow-2xs"
                        >
                          Atender
                        </button>
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
