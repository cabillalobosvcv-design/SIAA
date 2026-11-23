import React from 'react';
import { Asesoria } from '../../types/siaa';
import { StatusBadge } from '../common/StatusBadge';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  Eye,
  FileDown,
  GraduationCap,
  MapPin,
  Trash2,
  UserCheck
} from 'lucide-react';

interface AsesoriaCardProps {
  item: Asesoria;
  simplified: boolean;
  onSelect: (id: string) => void;
  onExportPDF: (item: Asesoria) => void;
  onEdit?: (item: Asesoria) => void;
  onReprogram?: (item: Asesoria) => void;
  onSeguimiento?: (item: Asesoria) => void;
  onCloseAdvisory?: (id: string) => void;
  onDelete?: (item: Asesoria) => void;
  canEdit?: boolean;
  canReprogram?: boolean;
  canSeguimiento?: boolean;
  canClose?: boolean;
  canDelete?: boolean;
}

export const AsesoriaCard: React.FC<AsesoriaCardProps> = ({
  item,
  simplified,
  onSelect,
  onExportPDF,
  onEdit,
  onReprogram,
  onSeguimiento,
  onCloseAdvisory,
  onDelete,
  canEdit = false,
  canReprogram = false,
  canSeguimiento = false,
  canClose = false,
  canDelete = false
}) => {
  return (
    <article className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-500/60 dark:hover:border-emerald-500/60 transition-colors flex flex-col justify-between p-5">
      <div className="space-y-4">
        {/* Card Header: Materia + Status (Detailed also shows Folio & Subject Code) */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {!simplified && (
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-1">
                <span className="font-bold text-emerald-900 dark:text-emerald-300">{item.folio}</span>
                <span aria-hidden="true">·</span>
                <span>{item.materiaCodigo}</span>
              </div>
            )}
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
              {item.materiaNombre}
            </h3>
            {simplified ? (
              item.sedeNombre && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {item.sedeNombre}
                </p>
              )
            ) : (
              (item.carreraNombre || item.divisionNombre || item.sedeNombre) && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {[item.divisionNombre, item.carreraNombre].filter(Boolean).join(' · ')}
                </p>
              )
            )}
          </div>
          <div className="shrink-0">
            <StatusBadge estado={item.estado} />
          </div>
        </div>

        {/* Core Information: Alumno & Docente Asesor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="min-w-0">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <GraduationCap className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
              Alumno
            </span>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5 truncate">
              {item.alumnoNombre}
            </p>
            {!simplified && (
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                {item.matricula} · {item.grupoNombre}
              </p>
            )}
          </div>

          <div className="min-w-0">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <UserCheck className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400 shrink-0" />
              Docente Asesor
            </span>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5 truncate">
              {item.docenteAsignadoNombre || 'Por asignar'}
            </p>
            {!simplified && item.fechaSolicitud && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                Solicitada: {item.fechaSolicitud}
              </p>
            )}
          </div>
        </div>

        {/* Schedule & Detailed Extras */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-1.5 font-medium tabular-nums">
              <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
              {item.fechaProgramada ? (
                <>
                  <span>{item.fechaProgramada}</span>
                  {item.horaInicio && (
                    <span className="text-slate-500 dark:text-slate-400">
                      · {item.horaInicio}–{item.horaTermino} hrs
                    </span>
                  )}
                </>
              ) : (
                <span className="text-slate-500 dark:text-slate-400">Fecha por programar</span>
              )}
            </span>

            {!simplified && (item.sedeNombre || item.aulaNombre || item.modalidad) && (
              <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                <span>
                  {[item.sedeNombre, item.aulaNombre || 'Aula por asignar', item.modalidad]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </span>
            )}
          </div>

          {!simplified && item.temasDificultad && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Temas:</span>{' '}
              {item.temasDificultad}
            </p>
          )}
        </div>
      </div>

      {/* Actions Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onSelect(item.id)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
        >
          <Eye className="w-3.5 h-3.5" />
          Ver Ficha
        </button>

        <div className="flex items-center gap-1 flex-wrap">
          {canSeguimiento && onSeguimiento && (
            <button
              type="button"
              onClick={() => onSeguimiento(item)}
              className="px-2.5 py-1.5 bg-amber-500 text-emerald-950 font-bold rounded-lg hover:bg-amber-400 inline-flex items-center gap-1 text-[11px] whitespace-nowrap shrink-0"
              title="Registrar o Editar Seguimiento"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {item.seguimiento ? 'Editar Seg.' : 'Seguimiento'}
            </button>
          )}

          {canClose && onCloseAdvisory && (
            <button
              type="button"
              onClick={() => onCloseAdvisory(item.id)}
              className="px-2.5 py-1.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-semibold rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-800/70 text-[11px] whitespace-nowrap shrink-0"
              title="Cerrar Asesoría en Sistema"
            >
              Cerrar
            </button>
          )}

          {!simplified && (
            <>
              <button
                type="button"
                onClick={() => onExportPDF(item)}
                className="p-1.5 text-emerald-800 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-md transition-colors"
                title="Descargar Ficha en PDF"
              >
                <FileDown className="w-4 h-4" />
              </button>

              {canEdit && onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(item)}
                  className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                  title="Modificar datos de asesoría"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}

              {canReprogram && onReprogram && (
                <button
                  type="button"
                  onClick={() => onReprogram(item)}
                  className="p-1.5 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-md transition-colors"
                  title="Modificar docente, horario o aula"
                >
                  <Calendar className="w-4 h-4" />
                </button>
              )}

              {canDelete && onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(item)}
                  className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-md transition-colors"
                  title="Eliminar registro de asesoría"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </article>
  );
};
