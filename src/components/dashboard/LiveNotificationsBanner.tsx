import React from 'react';
import { BellRing, CheckCheck, Eye, X } from 'lucide-react';
import { Notification } from '../../types/siaa';

interface LiveNotificationsBannerProps {
  unreadNotifications: Notification[];
  onSelectAdvisory: (id: string) => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export const LiveNotificationsBanner: React.FC<LiveNotificationsBannerProps> = ({
  unreadNotifications,
  onSelectAdvisory,
  onMarkRead,
  onMarkAllRead
}) => {
  if (unreadNotifications.length === 0) return null;

  const tipoBadgeStyle: Record<Notification['tipo'], string> = {
    asignacion: 'bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200',
    autorizacion: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200',
    solicitud: 'bg-sky-100 dark:bg-sky-900/60 text-sky-900 dark:text-sky-200',
    seguimiento: 'bg-teal-100 dark:bg-teal-900/60 text-teal-900 dark:text-teal-200',
    cancelacion: 'bg-rose-100 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200',
    recordatorio: 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-amber-300 dark:border-amber-800/80 shadow-xs overflow-hidden animate-fadeIn">
      <div className="px-4 py-2.5 bg-amber-50/90 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/60 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-950 dark:text-amber-200">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-600 dark:bg-amber-400" />
          </span>
          <BellRing className="w-4 h-4 text-amber-700 dark:text-amber-400" />
          <span>
            Novedades en Tiempo Real ({unreadNotifications.length} {unreadNotifications.length === 1 ? 'notificación nueva' : 'notificaciones nuevas'})
          </span>
        </div>

        <button
          type="button"
          onClick={onMarkAllRead}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-900 dark:text-amber-300 hover:underline"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          Marcar todas como leídas
        </button>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {unreadNotifications.slice(0, 3).map(notif => (
          <div
            key={notif.id}
            className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${tipoBadgeStyle[notif.tipo]}`}>
                  {notif.tipo}
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{notif.titulo}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">{notif.fechaCreacion}</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 truncate">
                {notif.mensaje}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {notif.referenciaId && (
                <button
                  type="button"
                  onClick={() => {
                    onMarkRead(notif.id);
                    onSelectAdvisory(notif.referenciaId!);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-white font-semibold text-[11px] transition-colors"
                >
                  <Eye className="w-3 h-3" />
                  Ver ficha
                </button>
              )}
              <button
                type="button"
                onClick={() => onMarkRead(notif.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Marcar como leída"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
