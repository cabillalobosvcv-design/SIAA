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
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      dot: 'bg-amber-500'
    },
    en_revision: {
      label: 'En Revisión',
      bg: 'bg-blue-50',
      text: 'text-blue-800',
      border: 'border-blue-200',
      dot: 'bg-blue-500'
    },
    aprobada: {
      label: 'Aprobada',
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500'
    },
    rechazada: {
      label: 'Rechazada',
      bg: 'bg-rose-50',
      text: 'text-rose-800',
      border: 'border-rose-200',
      dot: 'bg-rose-500'
    },
    asignada: {
      label: 'Asignada',
      bg: 'bg-sky-50',
      text: 'text-sky-800',
      border: 'border-sky-200',
      dot: 'bg-sky-500'
    },
    confirmada: {
      label: 'Confirmada',
      bg: 'bg-teal-50',
      text: 'text-teal-800',
      border: 'border-teal-200',
      dot: 'bg-teal-500'
    },
    en_proceso: {
      label: 'En Proceso',
      bg: 'bg-indigo-50',
      text: 'text-indigo-800',
      border: 'border-indigo-200',
      dot: 'bg-indigo-500'
    },
    realizada: {
      label: 'Realizada',
      bg: 'bg-emerald-100',
      text: 'text-emerald-900',
      border: 'border-emerald-300',
      dot: 'bg-emerald-600'
    },
    cancelada: {
      label: 'Cancelada',
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
      dot: 'bg-slate-400'
    },
    no_asistio: {
      label: 'No Asistió',
      bg: 'bg-orange-50',
      text: 'text-orange-800',
      border: 'border-orange-200',
      dot: 'bg-orange-500'
    },
    cerrada: {
      label: 'Cerrada',
      bg: 'bg-slate-200',
      text: 'text-slate-800',
      border: 'border-slate-300',
      dot: 'bg-slate-500'
    }
  };

  const item = config[estado] || {
    label: estado,
    bg: 'bg-slate-50',
    text: 'text-slate-800',
    border: 'border-slate-200',
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
    baja: { label: 'Baja', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
    media: { label: 'Media', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    alta: { label: 'Alta', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
    urgente: { label: 'Urgente', cls: 'bg-red-50 text-red-800 border-red-300 font-bold' }
  };

  const p = styles[prioridad] || styles.media;
  return (
    <span className={`text-xs px-2 py-0.5 rounded border ${p.cls} uppercase tracking-wider font-semibold whitespace-nowrap`}>
      {p.label}
    </span>
  );
};
