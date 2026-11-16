import { useEffect, useState, useRef, useCallback } from 'react';
import { storage } from '../db/storage';
import { User } from '../types';

export type RealtimeConnectionStatus = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING' | 'AUTH_FAILED';

export interface RealtimeServerEvent<T = any> {
  eventId: string;
  eventType: string;
  timestamp: string;
  entityType: 'work_order' | 'incident' | 'equipment' | 'care_record' | 'storm' | 'notification';
  entityId: string;
  actor: {
    userId: string;
    role: string;
    name?: string;
  };
  targetRoles: string[];
  targetUserId?: string;
  targetTeamId?: string;
  payload: T;
}

const MAX_EVENT_CACHE = 500;
const API_BASE_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? `http://${window.location.hostname}:5001`
  : 'http://localhost:5001';

/**
 * ⚡ HOOK ĐỒNG BỘ THỜI GIAN THỰC (SERVER-SENT EVENTS + DEDUPLICATION)
 * Quản lý 1 kết nối EventSource duy nhất theo phiên người dùng,
 * Tự động lọc trùng sự kiện (Event Deduplication LRU 500),
 * và kích hoạt Targeted Sync từ SQLite Database.
 */
export function useRealtimeSync(currentUser?: User | null) {
  const [connectionStatus, setConnectionStatus] = useState<RealtimeConnectionStatus>('DISCONNECTED');
  const [lastEvent, setLastEvent] = useState<RealtimeServerEvent | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('urbantree:sse-status', { detail: { status: connectionStatus } }));
    }
  }, [connectionStatus]);
  
  // Bộ đệm LRU chống trùng lặp sự kiện (Deduplication Cache)
  const processedEventIdsRef = useRef<Set<string>>(new Set());
  const eventIdListRef = useRef<string[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);
  const isMountedRef = useRef(true);

  const isDuplicate = useCallback((eventId: string): boolean => {
    if (!eventId) return false;
    if (processedEventIdsRef.current.has(eventId)) {
      return true;
    }
    processedEventIdsRef.current.add(eventId);
    eventIdListRef.current.push(eventId);

    // Duy trì kích thước tối đa 500 eventId
    if (eventIdListRef.current.length > MAX_EVENT_CACHE) {
      const oldestId = eventIdListRef.current.shift();
      if (oldestId) {
        processedEventIdsRef.current.delete(oldestId);
      }
    }
    return false;
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    // Không mở kết nối nếu không có người dùng hợp lệ
    if (!currentUser || currentUser.role === 'CITIZEN') {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setConnectionStatus('DISCONNECTED');
      return;
    }

    let isCancelled = false;

    async function initEventSource() {
      try {
        setConnectionStatus('CONNECTING');
        const token = await storage.getBackendAuthToken();

        if (isCancelled || !isMountedRef.current) return;

        if (!token) {
          setConnectionStatus('AUTH_FAILED');
          return;
        }

        // Đóng kết nối cũ nếu có
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }

        const sseUrl = `${API_BASE_URL}/api/events?token=${encodeURIComponent(token)}`;
        const es = new EventSource(sseUrl);
        eventSourceRef.current = es;

        // 1. Kết nối thành công (Handshake ACK)
        es.addEventListener('sse.connected', () => {
          if (!isMountedRef.current) return;
          setConnectionStatus('CONNECTED');
        });

        // 2. Yêu cầu Full Delta Refetch khi mất kết nối lâu hoặc tràn Buffer
        es.addEventListener('sse.full_delta_refetch', () => {
          if (!isMountedRef.current) return;
          storage.syncWorkOrdersFromBackend().catch(() => {});
          storage.syncIncidentsFromBackend().catch(() => {});
          storage.syncCareRecordsFromBackend().catch(() => {});
          storage.syncNotificationsFromBackend().catch(() => {});
        });

        // 3. Xử lý các sự kiện nghiệp vụ Work Orders & Storm
        const handleWorkOrderEvent = (ev: MessageEvent) => {
          try {
            const data: RealtimeServerEvent = JSON.parse(ev.data);
            if (isDuplicate(data.eventId)) return;

            setLastEvent(data);
            // Targeted Sync: Kéo lại đúng dữ liệu từ SQLite
            storage.syncWorkOrdersFromBackend().catch(() => {});
            if (data.eventType === 'work_order.completed' || data.eventType.startsWith('storm.')) {
              storage.syncCareRecordsFromBackend().catch(() => {});
            }
          } catch (err) {
            console.warn('[SSE Client] Lỗi parse sự kiện Work Order:', err);
          }
        };

        es.addEventListener('work_order.created', handleWorkOrderEvent);
        es.addEventListener('work_order.assigned', handleWorkOrderEvent);
        es.addEventListener('work_order.status_changed', handleWorkOrderEvent);
        es.addEventListener('work_order.item_updated', handleWorkOrderEvent);
        es.addEventListener('work_order.completed', handleWorkOrderEvent);
        es.addEventListener('storm.batch_dispatched', handleWorkOrderEvent);
        es.addEventListener('auto_schedule.dispatched', handleWorkOrderEvent);
        es.addEventListener('equipment.status_changed', handleWorkOrderEvent);
        es.addEventListener('equipment.assigned', handleWorkOrderEvent);

        // 4. Xử lý sự kiện Incidents
        const handleIncidentEvent = (ev: MessageEvent) => {
          try {
            const data: RealtimeServerEvent = JSON.parse(ev.data);
            if (isDuplicate(data.eventId)) return;

            setLastEvent(data);
            // Targeted Sync Incidents
            storage.syncIncidentsFromBackend().catch(() => {});
          } catch (err) {
            console.warn('[SSE Client] Lỗi parse sự kiện Incident:', err);
          }
        };

        es.addEventListener('incident.created', handleIncidentEvent);
        es.addEventListener('incident.status_changed', handleIncidentEvent);
        es.addEventListener('incident.work_order_linked', handleIncidentEvent);

        // 5. Xử lý sự kiện Thông báo (Wave 3.2: Persistent Notification Hub & Fix P1 Delete Sync)
        const handleNotificationEvent = (ev: MessageEvent) => {
          try {
            const data: RealtimeServerEvent = JSON.parse(ev.data);
            if (isDuplicate(data.eventId)) return;

            setLastEvent(data);
            // Targeted Sync: Kéo lại thông báo mới nhất từ SQLite
            storage.syncNotificationsFromBackend().catch(() => {});
          } catch (err) {
            console.warn('[SSE Client] Lỗi parse sự kiện Notification:', err);
          }
        };

        es.addEventListener('notification.pushed', handleNotificationEvent);
        es.addEventListener('notification.read', handleNotificationEvent);
        es.addEventListener('notification.read_all', handleNotificationEvent);
        es.addEventListener('notification.deleted', handleNotificationEvent);

        // 6. Quản lý trạng thái lỗi & Reconnect tự nhiên của EventSource
        es.onerror = () => {
          if (!isMountedRef.current) return;
          if (es.readyState === EventSource.CONNECTING) {
            setConnectionStatus('RECONNECTING');
          } else if (es.readyState === EventSource.CLOSED) {
            setConnectionStatus('DISCONNECTED');
          }
        };
      } catch (err) {
        if (!isMountedRef.current) return;
        setConnectionStatus('DISCONNECTED');
      }
    }

    initEventSource();

    return () => {
      isCancelled = true;
      isMountedRef.current = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [currentUser?.id, currentUser?.role, isDuplicate]);

  return {
    connectionStatus,
    lastEvent,
    refetchAll: () => {
      storage.syncWorkOrdersFromBackend().catch(() => {});
      storage.syncIncidentsFromBackend().catch(() => {});
      storage.syncCareRecordsFromBackend().catch(() => {});
    }
  };
}
