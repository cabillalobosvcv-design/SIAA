import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { Asesoria } from '../../types/siaa';
import { StatusBadge, PriorityBadge } from '../common/StatusBadge';
import { SIAADataService } from '../../services/siaaService';
import { useAuth } from '../../context/AuthContext';
import { useInstitutionalConfig } from '../../hooks/useInstitutionalConfig';
import { canRegisterSeguimiento } from '../../utils/roles';
import { printFichaAsesoria } from '../../utils/printFicha';
import {
  FileDown,
  Printer,
  GraduationCap,
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
  const { currentRole } = useAuth();
  const institutionalConfig = useInstitutionalConfig();
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!actionMessage) return;
    const timer = setTimeout(() => setActionMessage(null), 2800);
    return () => clearTimeout(timer);
  }, [actionMessage]);

  if (!asesoria) return null;

  const canFollowUp = canRegisterSeguimiento(currentRole);

  const handleDownloadPDF = () => {
    SIAADataService.exportFichaPDF(asesoria);
    setActionMessage('Ficha exportada a PDF correctamente.');
  };

  const handlePrintFicha = () => {
    printFichaAsesoria(asesoria, institutionalConfig);
    setActionMessage('Preparando vista de impresión...');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Ficha de Asesoría Académica — ${asesoria.folio}`}
      subtitle="Expediente institucional oficial de asesoría, tutoría y seguimiento pedagógico"
      maxWidth="3xl"
    >
      <div className="space-y-6 text-xs text-slate-800 dark:text-slate-100">
        
        {/* Header Action Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono font-bold text-sm text-emerald-950 dark:text-emerald-200 bg-emerald-100/80 dark:bg-emerald-900/60 px-2.5 py-1 rounded">
              {asesoria.folio}
            </span>
            <StatusBadge estado={asesoria.estado} size="md" />
            <PriorityBadge prioridad={asesoria.prioridad} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrintFicha}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 font-semibold shadow-xs transition-colors"
              title="Imprimir ficha oficial de la sesión"
            >
              <Printer className="w-4 h-4 text-emerald-800 dark:text-emerald-400" />
              Imprimir
            </button>
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-white font-semibold shadow-xs transition-colors"
              title="Descargar respaldo digital en formato PDF"
            >
              <FileDown className="w-4 h-4 text-amber-400" />
              Exportar a PDF
            </button>
            {onOpenSeguimiento && canFollowUp && (asesoria.estado === 'confirmada' || asesoria.estado === 'en_proceso' || asesoria.estado === 'realizada') && (
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

        {actionMessage && (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 font-medium animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Section 1: Datos del Alumno */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-emerald-800 dark:text-emerald-400" />
            1. Datos del Alumno y Programa Académico
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <span className="text-slate-400 dark:text-slate-500 font-medium block text-[11px]">Nombre Completo</span>
              <p className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">{asesoria.alumnoNombre}</p>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 font-medium block text-[11px]">Matrícula Oficial</span>
              <p className="font-mono font-bold text-emerald-900 dark:text-emerald-300 text-sm mt-0.5">{asesoria.matricula}</p>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 font-medium block text-[11px]">Grupo y Cuatrimestre</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{asesoria.grupoNombre} • {asesoria.cuatrimestreNumero}° Cuatrimestre</p>
            </div>
            <div className="sm:col-span-2 md:col-span-3">
              <span className="text-slate-400 dark:text-slate-500 font-medium block text-[11px]">Carrera / Programa</span>
              <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{asesoria.carreraNombre}</p>
            </div>
          </div>
        </div>

        {/* Section 2: Detalles de la Asesoría y Programación */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-800 dark:text-emerald-400" />
            2. Información de la Asesoría y Programación
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-slate-400 dark:text-slate-500 font-medium block text-[11px]">Materia / Asignatura</span>
                <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">{asesoria.materiaNombre}</p>
                <p className="text-slate-500 dark:text-slate-400 font-mono text-[10px]">{asesoria.materiaCodigo}</p>
              </div>

              <div>
                <span className="text-slate-400 dark:text-slate-500 font-medium block text-[11px]">Docente Asesor Asignado</span>
                <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">{asesoria.docenteAsignadoNombre || 'Sin asignar'}</p>
                <p className="text-emerald-700 dark:text-emerald-400 font-medium text-[10px]">Catedrático Especialista</p>
              </div>

              <div>
                <span className="text-slate-400 dark:text-slate-500 font-medium block text-[11px]">Fecha y Horario</span>
                <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">{asesoria.fechaProgramada || 'Por definir'}</p>
                <p className="text-slate-600 dark:text-slate-300 text-[10px]">{asesoria.horaInicio ? `${asesoria.horaInicio} a ${asesoria.horaTermino} hrs` : '--'}</p>
              </div>

              <div>
                <span className="text-slate-400 dark:text-slate-500 font-medium block text-[11px]">Aula / Modalidad</span>
                <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">{asesoria.aulaNombre || 'Por definir'}</p>
                <p className="text-slate-500 dark:text-slate-400 capitalize text-[10px]">{asesoria.modalidad || 'Presencial'}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg space-y-2 border border-slate-100 dark:border-slate-700/70">
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-200">Motivo de la solicitud:</span>
                <p className="text-slate-600 dark:text-slate-300 mt-0.5">{asesoria.motivo}</p>
              </div>
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-200">Temas específicos con dificultad:</span>
                <p className="text-slate-600 dark:text-slate-300 mt-0.5">{asesoria.temasDificultad}</p>
              </div>
              {asesoria.observaciones && (
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Observaciones generales:</span>
                  <p className="text-slate-600 dark:text-slate-300 mt-0.5">{asesoria.observaciones}</p>
                </div>
              )}
            </div>

            {/* Autorización info */}
            {asesoria.autorizadaPor && (
              <div className="flex items-center gap-2 text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span>
                  Autorizada por: <strong>{asesoria.autorizadaPor}</strong> el {asesoria.fechaAutorizacion}
                  {asesoria.observacionesAutorizacion && ` — "${asesoria.observacionesAutorizacion}"`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Seguimiento y Resultados (Requirement 19, 20) */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-800 dark:text-emerald-400" />
            3. Seguimiento Pedagógico y Resultados
          </div>
          <div className="p-4">
            {asesoria.seguimiento ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-700/70">
                    <span className="font-bold text-slate-700 dark:text-slate-200 block">Temas Trabajados en Sesión:</span>
                    <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{asesoria.seguimiento.temasTrabajados}</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-700/70">
                    <span className="font-bold text-slate-700 dark:text-slate-200 block">Dificultades Específicas Detectadas:</span>
                    <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{asesoria.seguimiento.dificultadesDetectadas}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-700/70">
                    <span className="font-bold text-slate-700 dark:text-slate-200 block">Actividades y Ejercicios Desarrollados:</span>
                    <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{asesoria.seguimiento.actividadesRealizadas}</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-700/70">
                    <span className="font-bold text-slate-700 dark:text-slate-200 block">Recomendaciones para el Alumno:</span>
                    <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{asesoria.seguimiento.recomendaciones}</p>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-semibold text-emerald-900 dark:text-emerald-300 block">Resultado Obtenido:</span>
                    <span className="font-bold text-sm text-emerald-950 dark:text-emerald-200 uppercase">
                      {asesoria.seguimiento.resultado.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-emerald-900 dark:text-emerald-300 block">¿Requiere Nueva Asesoría?:</span>
                    <span className={`font-bold text-sm ${asesoria.seguimiento.requiereNuevaAsesoria ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-800 dark:text-emerald-300'}`}>
                      {asesoria.seguimiento.requiereNuevaAsesoria ? 'SÍ (Programar refuerzo)' : 'NO (Superó dificultad)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-emerald-900 dark:text-emerald-300 block">Fecha de Seguimiento:</span>
                    <span className="text-slate-700 dark:text-slate-200 font-medium">{asesoria.seguimiento.fechaSeguimiento}</span>
                  </div>
                </div>

                {/* Evidencias (Requirement 20) */}
                {asesoria.seguimiento.evidencias && asesoria.seguimiento.evidencias.length > 0 && (
                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-200 block mb-2 flex items-center gap-1.5">
                      <Paperclip className="w-4 h-4 text-emerald-800 dark:text-emerald-400" />
                      Evidencias Adjuntas ({asesoria.seguimiento.evidencias.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {asesoria.seguimiento.evidencias.map(evi => (
                        <a
                          key={evi.id}
                          href={evi.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-500 bg-slate-50 dark:bg-slate-800/70 flex items-center justify-between text-xs transition-colors group"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                            <span className="font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-emerald-900 dark:group-hover:text-emerald-300">
                              {evi.nombre}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 ml-2">{evi.tamanio || 'Archivo'}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <AlertCircle className="w-6 h-6 mx-auto mb-2 text-slate-400 dark:text-slate-500" />
                <p className="font-medium">Aún no se ha registrado el seguimiento ni los resultados de esta asesoría.</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">El docente asesor completará este apartado una vez concluida la sesión.</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            Expediente {institutionalConfig.nombreCorto || 'SIAA'} • Coordinación de Calidad Académica
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintFicha}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir
            </button>
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-900 hover:bg-emerald-800 text-white font-semibold rounded-lg transition-colors"
            >
              <FileDown className="w-3.5 h-3.5 text-amber-400" />
              Exportar a PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg transition-colors"
            >
              Cerrar Ficha
            </button>
          </div>
        </div>

      </div>
    </Modal>
  );
};
