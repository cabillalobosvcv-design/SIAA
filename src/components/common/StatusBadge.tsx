import React from 'react';
import { EstadoAsesoria, Prioridad } from '../../types/siaa';

interface StatusBadgeProps {
  estado: EstadoAsesoria;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ estado, size = 'sm' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2.5 py-0.5 font-medium',
    md: 'text-sm px-3 py-1 font-semibold',
    lg: 'text-base px-3.5 py-1.5 font-semibold'
  }[size];

  const config: Record<EstadoAsesoria, { label: string; bg: string; text: string; dot: string; border: string }> = {
    pendiente: {
      label: 'Pendiente',
      bg: 'bg-amber-50 dark:bg-amber-950/60',
      text: 'text-amber-800 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800/70',
      dot: 'bg-amber-500'
    },
    en_revision: {
      label: 'En Revisión',
      bg: 'bg-blue-50 dark:bg-blue-950/60',
      text: 'text-blue-800 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800/70',
      dot: 'bg-blue-500'
    },
    aprobada: {
      label: 'Aprobada',
      bg: 'bg-emerald-50 dark:bg-emerald-950/60',
      text: 'text-emerald-800 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800/70',
      dot: 'bg-emerald-500'
    },
    rechazada: {
      label: 'Rechazada',
      bg: 'bg-rose-50 dark:bg-rose-950/60',
      text: 'text-rose-800 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-800/70',
      dot: 'bg-rose-500'
    },
    asignada: {
      label: 'Asignada',
      bg: 'bg-sky-50 dark:bg-sky-950/60',
      text: 'text-sky-800 dark:text-sky-300',
      border: 'border-sky-200 dark:border-sky-800/70',
      dot: 'bg-sky-500'
    },
    confirmada: {
      label: 'Confirmada',
      bg: 'bg-teal-50 dark:bg-teal-950/60',
      text: 'text-teal-800 dark:text-teal-300',
      border: 'border-teal-200 dark:border-teal-800/70',
      dot: 'bg-teal-500'
    },
    en_proceso: {
      label: 'En Proceso',
      bg: 'bg-indigo-50 dark:bg-indigo-950/60',
      text: 'text-indigo-800 dark:text-indigo-300',
      border: 'border-indigo-200 dark:border-indigo-800/70',
      dot: 'bg-indigo-500'
    },
    realizada: {
      label: 'Realizada',
      bg: 'bg-emerald-100 dark:bg-emerald-900/60',
      text: 'text-emerald-900 dark:text-emerald-200',
      border: 'border-emerald-300 dark:border-emerald-700',
      dot: 'bg-emerald-600 dark:bg-emerald-400'
    },
    cancelada: {
      label: 'Cancelada',
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-700 dark:text-slate-300',
      border: 'border-slate-200 dark:border-slate-700',
      dot: 'bg-slate-400'
    },
    no_asistio: {
      label: 'No Asistió',
      bg: 'bg-orange-50 dark:bg-orange-950/60',
      text: 'text-orange-800 dark:text-orange-300',
      border: 'border-orange-200 dark:border-orange-800/70',
      dot: 'bg-orange-500'
    },
    cerrada: {
      label: 'Cerrada',
      bg: 'bg-slate-200 dark:bg-slate-800',
      text: 'text-slate-800 dark:text-slate-200',
      border: 'border-slate-300 dark:border-slate-700',
      dot: 'bg-slate-500 dark:bg-slate-400'
    }
  };

  const item = config[estado] || {
    label: estado,
    bg: 'bg-slate-50 dark:bg-slate-800',
    text: 'text-slate-800 dark:text-slate-200',
    border: 'border-slate-200 dark:border-slate-700',
    dot: 'bg-slate-400'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${item.bg} ${item.text} ${item.border} ${sizeClasses} tracking-tight whitespace-nowrap`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
      {item.label}
    </span>
  );
};

export const PriorityBadge: React.FC<{ prioridad: Prioridad }> = ({ prioridad }) => {
  const styles: Record<Prioridad, { label: string; cls: string }> = {
    baja: { label: 'Baja', cls: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700' },
    media: { label: 'Media', cls: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/70' },
    alta: { label: 'Alta', cls: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/70' },
    urgente: { label: 'Urgente', cls: 'bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800/70 font-bold' }
  };

  const p = styles[prioridad] || styles.media;
  return (
    <span className={`text-xs px-2 py-0.5 rounded border ${p.cls} uppercase tracking-wider font-semibold whitespace-nowrap`}>
      {p.label}
    </span>
  );
};
