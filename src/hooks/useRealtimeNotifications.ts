import { useCallback, useEffect, useMemo, useState } from 'react';
import { Notification } from '../types/siaa';
import { SIAADataService } from '../services/siaaService';

export interface WidgetNotificationMatchOptions {
  tipos?: Notification['tipo'][];
  advisoryIds?: string[];
  requireBoth?: boolean;
}

export function useRealtimeNotifications(userId?: string) {
  const [syncTick, setSyncTick] = useState(0);

  useEffect(() => {
    const bump = () => setSyncTick(t => t + 1);

    const handleStorage = (e: StorageEvent) => {
      if (
        !e.key ||
        e.key === 'siaa_notifications' ||
        e.key === 'siaa_asesorias' ||
        e.key === 'siaa_users'
      ) {
        bump();
      }
    };

    window.addEventListener('siaa-notifications-updated', bump);
    window.addEventListener('siaa-asesorias-updated', bump);
    window.addEventListener('siaa-users-updated', bump);
    window.addEventListener('storage', handleStorage);

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        channel = new BroadcastChannel('siaa-realtime-sync');
        channel.onmessage = () => bump();
      } catch {
        channel = null;
      }
    }

    return () => {
      window.removeEventListener('siaa-notifications-updated', bump);
      window.removeEventListener('siaa-asesorias-updated', bump);
      window.removeEventListener('siaa-users-updated', bump);
      window.removeEventListener('storage', handleStorage);
      try {
        channel?.close();
      } catch {
        // Ignore close errors
      }
    };
  }, []);

  const notifications = useMemo(() => {
    void syncTick;
    if (!userId) return [];
    return SIAADataService.getNotifications(userId);
  }, [userId, syncTick]);

  const unreadNotifications = useMemo(
    () => notifications.filter(n => !n.leida),
    [notifications]
  );

  const unreadCount = unreadNotifications.length;
  const latestUnread = unreadNotifications[0] ?? null;

  const getUnreadForWidget = useCallback(
    (options: WidgetNotificationMatchOptions): Notification[] => {
      const { tipos, advisoryIds, requireBoth = false } = options;
      const tipoSet = tipos ? new Set(tipos) : null;
      const idSet = advisoryIds ? new Set(advisoryIds) : null;

      return unreadNotifications.filter(n => {
        const matchesTipo = tipoSet ? tipoSet.has(n.tipo) : false;
        const matchesId = idSet && n.referenciaId ? idSet.has(n.referenciaId) : false;

        if (tipoSet && idSet) {
          return requireBoth ? matchesTipo && matchesId : matchesTipo || matchesId;
        }
        if (tipoSet) return matchesTipo;
        if (idSet) return matchesId;
        return false;
      });
    },
    [unreadNotifications]
  );

  const markRead = useCallback((id: string) => {
    SIAADataService.markNotificationAsRead(id);
  }, []);

  const markIdsRead = useCallback(
    (ids: string[]) => {
      if (!userId || ids.length === 0) return;
      SIAADataService.markNotificationsReadByIds(userId, ids);
    },
    [userId]
  );

  const markAllRead = useCallback(() => {
    if (!userId) return;
    SIAADataService.markAllNotificationsAsRead(userId);
  }, [userId]);

  return {
    syncTick,
    notifications,
    unreadNotifications,
    unreadCount,
    latestUnread,
    getUnreadForWidget,
    markRead,
    markIdsRead,
    markAllRead
  };
}
