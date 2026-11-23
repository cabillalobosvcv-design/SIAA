import React from 'react';
import { BellRing } from 'lucide-react';
import { Notification } from '../../types/siaa';

interface WidgetNotificationBadgeProps {
  items: Notification[];
  tone?: 'amber' | 'emerald' | 'teal' | 'rose';
  compact?: boolean;
}

export const WidgetNotificationBadge: React.FC<WidgetNotificationBadgeProps> = ({
  items,
  tone = 'amber',
  compact = false
}) => {
  if (!items || items.length === 0) return null;

  const latest = items[0];
  const toneClasses = {
    amber: 'bg-amber-500 text-emerald-950 border-amber-400',
    emerald: 'bg-emerald-600 text-white border-emerald-500',
    teal: 'bg-teal-600 text-white border-teal-500',
    rose: 'bg-rose-600 text-white border-rose-500'
  }[tone];

  const dotPingClasses = {
    amber: 'bg-emerald-950',
    emerald: 'bg-white',
    teal: 'bg-white',
    rose: 'bg-white'
  }[tone];

  return (
    <span
      title={`${latest.titulo}: ${latest.mensaje}`}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-xs ${toneClasses}`}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotPingClasses}`} />
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotPingClasses}`} />
      </span>
      <BellRing className="w-3 h-3 shrink-0" />
      {compact ? (
        <span>+{items.length}</span>
      ) : (
        <span>{items.length} {items.length === 1 ? 'nueva' : 'nuevas'}</span>
      )}
    </span>
  );
};
