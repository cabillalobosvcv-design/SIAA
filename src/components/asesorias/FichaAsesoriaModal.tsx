import React from 'react';
import { Modal } from '../common/Modal';
import { Asesoria } from '../../types/siaa';
import { StatusBadge, PriorityBadge } from '../common/StatusBadge';
import { SIAADataService } from '../../services/siaaService';
import {
  FileDown,
  User,
  GraduationCap,
  Calendar,
  Clock,
  DoorOpen,
  BookOpen,
  CheckCircle2,
  FileText,
  Paperclip,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface FichaAsesoriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  asesoria: Asesoria | null;
  onOpenSeguimiento?: (asesoria: Asesoria) => void;
}

export const FichaAsesoriaModal: React.FC<FichaAsesoriaModalProps> = ({
  isOpen,
  onClose,
  asesoria,
  onOpenSeguimiento
}) => {
  if (!asesoria) return null;

  const handleDownloadPDF = () => {
    SIAADataService.exportFichaPDF(asesoria);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Ficha de Asesoría Académica — ${asesoria.folio}`}
      subtitle="Expediente institucional oficial de asesoría, tutoría y seguimiento pedagógico"
      maxWidth="3xl"
    >
      <div className="space-y-6 text-xs text-slate-800">
        
        {/* Header Action Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-sm text-emerald-950 bg-emerald-100/80 px-2.5 py-1 rounded">
              {asesoria.folio}
            </span>
            <StatusBadge estado={asesoria.estado} size="md" />
            <PriorityBadge prioridad={asesoria.prioridad} />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-white font-semibold shadow-xs transition-colors"
            >
              <FileDown className="w-4 h-4 text-amber-400" />
              Descargar Ficha PDF
            </button>
            {onOpenSeguimiento && (asesoria.estado === 'confirmada' || asesoria.estado === 'en_proceso' || asesoria.estado === 'realizada') && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSeguimiento(asesoria);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold shadow-xs transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                {asesoria.seguimiento ? 'Modificar Seguimiento' : 'Registrar Seguimiento'}
              </button>
            )}
          </div>
        </div>

        {/* Section 1: Datos del Alumno */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-emerald-800" />
            1. Datos del Alumno y Programa Académico
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <span className="text-slate-400 font-medium block text-[11px]">Nombre Completo</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{asesoria.alumnoNombre}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[11px]">Matrícula Oficial</span>
              <p className="font-mono font-bold text-emerald-900 text-sm mt-0.5">{asesoria.matricula}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[11px]">Grupo y Cuatrimestre</span>
              <p className="font-semibold text-slate-800 mt-0.5">{asesoria.grupoNombre} • {asesoria.cuatrimestreNumero}° Cuatrimestre</p>
            </div>
            <div className="sm:col-span-2 md:col-span-3">
              <span className="text-slate-400 font-medium block text-[11px]">Carrera / Programa</span>
              <p className="font-medium text-slate-800 mt-0.5">{asesoria.carreraNombre}</p>
            </div>
          </div>
        </div>

        {/* Section 2: Detalles de la Asesoría y Programación */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-800" />
            2. Información de la Asesoría y Programación
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-slate-400 font-medium block text-[11px]">Materia / Asignatura</span>
                <p className="font-bold text-slate-900 mt-0.5">{asesoria.materiaNombre}</p>
                <p className="text-slate-500 font-mono text-[10px]">{asesoria.materiaCodigo}</p>
              </div>

              <div>
                <span className="text-slate-400 font-medium block text-[11px]">Docente Asesor Asignado</span>
                <p className="font-bold text-slate-900 mt-0.5">{asesoria.docenteAsignadoNombre || 'Sin asignar'}</p>
                <p className="text-emerald-700 font-medium text-[10px]">Catedrático Especialista</p>
              </div>

              <div>
                <span className="text-slate-400 font-medium block text-[11px]">Fecha y Horario</span>
                <p className="font-bold text-slate-900 mt-0.5">{asesoria.fechaProgramada || 'Por definir'}</p>
                <p className="text-slate-600 text-[10px]">{asesoria.horaInicio ? `${asesoria.horaInicio} a ${asesoria.horaTermino} hrs` : '--'}</p>
              </div>

              <div>
                <span className="text-slate-400 font-medium block text-[11px]">Aula / Modalidad</span>
                <p className="font-bold text-slate-900 mt-0.5">{asesoria.aulaNombre || 'Por definir'}</p>
                <p className="text-slate-500 capitalize text-[10px]">{asesoria.modalidad || 'Presencial'}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg space-y-2 border border-slate-100">
              <div>
                <span className="font-semibold text-slate-700">Motivo de la solicitud:</span>
                <p className="text-slate-600 mt-0.5">{asesoria.motivo}</p>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Temas específicos con dificultad:</span>
                <p className="text-slate-600 mt-0.5">{asesoria.temasDificultad}</p>
              </div>
              {asesoria.observaciones && (
                <div>
                  <span className="font-semibold text-slate-700">Observaciones generales:</span>
                  <p className="text-slate-600 mt-0.5">{asesoria.observaciones}</p>
                </div>
              )}
            </div>

            {/* Autorización info */}
            {asesoria.autorizadaPor && (
              <div className="flex items-center gap-2 text-[11px] text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>
                  Autorizada por: <strong>{asesoria.autorizadaPor}</strong> el {asesoria.fechaAutorizacion}
                  {asesoria.observacionesAutorizacion && ` — "${asesoria.observacionesAutorizacion}"`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Seguimiento y Resultados (Requirement 19, 20) */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-800" />
            3. Seguimiento Pedagógico y Resultados
          </div>
          <div className="p-4">
            {asesoria.seguimiento ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="font-bold text-slate-700 block">Temas Trabajados en Sesión:</span>
                    <p className="text-slate-600 mt-1 leading-relaxed">{asesoria.seguimiento.temasTrabajados}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="font-bold text-slate-700 block">Dificultades Específicas Detectadas:</span>
                    <p className="text-slate-600 mt-1 leading-relaxed">{asesoria.seguimiento.dificultadesDetectadas}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="font-bold text-slate-700 block">Actividades y Ejercicios Desarrollados:</span>
                    <p className="text-slate-600 mt-1 leading-relaxed">{asesoria.seguimiento.actividadesRealizadas}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="font-bold text-slate-700 block">Recomendaciones para el Alumno:</span>
                    <p className="text-slate-600 mt-1 leading-relaxed">{asesoria.seguimiento.recomendaciones}</p>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-semibold text-emerald-900 block">Resultado Obtenido:</span>
                    <span className="font-bold text-sm text-emerald-950 uppercase">
                      {asesoria.seguimiento.resultado.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-emerald-900 block">¿Requiere Nueva Asesoría?:</span>
                    <span className={`font-bold text-sm ${asesoria.seguimiento.requiereNuevaAsesoria ? 'text-amber-700' : 'text-emerald-800'}`}>
                      {asesoria.seguimiento.requiereNuevaAsesoria ? 'SÍ (Programar refuerzo)' : 'NO (Superó dificultad)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-emerald-900 block">Fecha de Seguimiento:</span>
                    <span className="text-slate-700 font-medium">{asesoria.seguimiento.fechaSeguimiento}</span>
                  </div>
                </div>

                {/* Evidencias (Requirement 20) */}
                {asesoria.seguimiento.evidencias && asesoria.seguimiento.evidencias.length > 0 && (
                  <div>
                    <span className="font-bold text-slate-700 block mb-2 flex items-center gap-1.5">
                      <Paperclip className="w-4 h-4 text-emerald-800" />
                      Evidencias Adjuntas ({asesoria.seguimiento.evidencias.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {asesoria.seguimiento.evidencias.map(evi => (
                        <a
                          key={evi.id}
                          href={evi.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2.5 rounded-lg border border-slate-200 hover:border-emerald-500 bg-slate-50 flex items-center justify-between text-xs transition-colors group"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span className="font-medium text-slate-800 truncate group-hover:text-emerald-900">
                              {evi.nombre}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0 ml-2">{evi.tamanio || 'Archivo'}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 bg-slate-50 rounded-lg">
                <AlertCircle className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                <p className="font-medium">Aún no se ha registrado el seguimiento ni los resultados de esta asesoría.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">El docente asesor completará este apartado una vez concluida la sesión.</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <p className="text-[10px] text-slate-400">
            Expediente SIAA • Coordinación de Calidad Académica
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
          >
            Cerrar Ficha
          </button>
        </div>

      </div>
    </Modal>
  );
};
