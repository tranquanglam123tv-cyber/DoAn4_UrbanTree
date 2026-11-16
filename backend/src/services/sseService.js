/**
 * ⚡ REALTIME SERVER-SENT EVENTS (SSE) SERVICE
 * Quản lý kết nối tập trung, Heartbeat 15s, Replay Buffer và Lọc phân quyền (Role/User/Team)
 * Tuân thủ tuyệt đối:
 * - Không log JWT raw
 * - Native EventSource auto-reconnect
 * - Replay nếu Last-Event-ID còn trong buffer, ngược lại phát FULL_DELTA_REFETCH
 * - Data Minimization: Không đưa PII nhạy cảm vào payload broadcast
 */

class SseService {
  constructor() {
    this.clients = new Map();
    this.eventBuffer = [];
    this.MAX_BUFFER_SIZE = 200;
    this.heartbeatTimer = null;
    this.startHeartbeat();
  }

  startHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, 15000);
    if (this.heartbeatTimer.unref) {
      this.heartbeatTimer.unref();
    }
  }

  sendHeartbeat() {
    const deadClients = [];
    for (const [clientId, client] of this.clients.entries()) {
      try {
        if (client.res.writableEnded || client.res.finished) {
          deadClients.push(clientId);
          continue;
        }
        client.res.write(`:keepalive ${Date.now()}\n\n`);
      } catch {
        deadClients.push(clientId);
      }
    }
    for (const id of deadClients) {
      this.clients.delete(id);
    }
  }

  /**
   * Đăng ký kết nối SSE từ client
   */
  addClient(req, res) {
    const user = req.user || { id: 'anonymous', role: 'CITIZEN' };
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Thiết lập HTTP headers cho Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // Chống buffering Nginx / Cloudflare
    });

    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }

    const clientRecord = {
      id: clientId,
      res,
      user: {
        id: String(user.id),
        role: String(user.role).toUpperCase(),
        username: user.username || 'unknown',
        teamId: user.teamId || req.query.teamId || null
      },
      connectedAt: new Date().toISOString()
    };

    this.clients.set(clientId, clientRecord);

    // Gửi sự kiện chào mừng xác nhận kết nối thành công (ACK)
    const ackPayload = {
      clientId,
      userId: clientRecord.user.id,
      role: clientRecord.user.role,
      connectedAt: clientRecord.connectedAt
    };
    res.write(`event: sse.connected\ndata: ${JSON.stringify(ackPayload)}\n\n`);

    // Xử lý Replay Buffer nếu client gửi Last-Event-ID
    const lastEventId = req.headers['last-event-id'] || req.query.lastEventId;
    if (lastEventId) {
      const idx = this.eventBuffer.findIndex((e) => e.eventId === lastEventId);
      if (idx !== -1) {
        // Replay các event tiếp sau lastEventId
        const missedEvents = this.eventBuffer.slice(idx + 1);
        for (const ev of missedEvents) {
          if (this.canClientReceiveEvent(clientRecord, ev)) {
            res.write(`id: ${ev.eventId}\nevent: ${ev.eventType}\ndata: ${JSON.stringify(ev)}\n\n`);
          }
        }
      } else {
        // Buffer đã bị tràn hoặc event ID không tồn tại -> Báo client FULL_DELTA_REFETCH
        res.write(
          `event: sse.full_delta_refetch\ndata: ${JSON.stringify({
            reason: 'BUFFER_OVERFLOW',
            lastEventId,
            timestamp: new Date().toISOString()
          })}\n\n`
        );
      }
    }

    // Lắng nghe khi client đóng kết nối
    req.on('close', () => {
      this.clients.delete(clientId);
    });

    req.on('error', () => {
      this.clients.delete(clientId);
    });

    return clientId;
  }

  /**
   * Kiểm tra quyền nhận sự kiện của client
   */
  canClientReceiveEvent(client, event) {
    // 1. Lọc theo Role
    if (event.targetRoles && event.targetRoles.length > 0) {
      if (!event.targetRoles.includes(client.user.role)) {
        return false;
      }
    }

    // 2. Lọc theo User ID đích (nếu có)
    if (event.targetUserId && String(client.user.id) !== String(event.targetUserId)) {
      return false;
    }

    // 3. Lọc theo Team ID đích (nếu có và client là STAFF)
    if (event.targetTeamId && client.user.role === 'STAFF') {
      if (client.user.teamId && client.user.teamId !== event.targetTeamId) {
        return false;
      }
    }

    return true;
  }

  /**
   * Phát sự kiện thời gian thực (CHỈ GỌI SAU KHI SQLITE TRANSACTION COMMIT THÀNH CÔNG)
   */
  broadcast(rawEvent) {
    if (!rawEvent || !rawEvent.eventType) return;

    const eventId = rawEvent.eventId || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const timestamp = rawEvent.timestamp || new Date().toISOString();

    const serverEvent = {
      eventId,
      eventType: rawEvent.eventType,
      timestamp,
      entityType: rawEvent.entityType || 'work_order',
      entityId: String(rawEvent.entityId || ''),
      actor: rawEvent.actor || { userId: 'system', role: 'SYSTEM' },
      targetRoles: rawEvent.targetRoles || ['ADMIN', 'DISPATCHER', 'STAFF'],
      targetUserId: rawEvent.targetUserId,
      targetTeamId: rawEvent.targetTeamId,
      payload: rawEvent.payload || {}
    };

    // Lưu vào Ring Buffer (giới hạn MAX_BUFFER_SIZE)
    this.eventBuffer.push(serverEvent);
    if (this.eventBuffer.length > this.MAX_BUFFER_SIZE) {
      this.eventBuffer.shift();
    }

    // Gửi chunk SSE cho các client thỏa điều kiện phân quyền
    const message = `id: ${serverEvent.eventId}\nevent: ${serverEvent.eventType}\ndata: ${JSON.stringify(serverEvent)}\n\n`;

    for (const [, client] of this.clients.entries()) {
      try {
        if (this.canClientReceiveEvent(client, serverEvent)) {
          client.res.write(message);
        }
      } catch (err) {
        // Socket lỗi sẽ được dọn dẹp bởi heartbeat hoặc close listener
      }
    }

    return serverEvent;
  }

  getClientCount() {
    return this.clients.size;
  }

  getBufferStats() {
    return {
      activeClients: this.clients.size,
      bufferedEventsCount: this.eventBuffer.length,
      maxBufferSize: this.MAX_BUFFER_SIZE
    };
  }

  clearAllClients() {
    for (const [, client] of this.clients.entries()) {
      try {
        client.res.end();
      } catch {}
    }
    this.clients.clear();
  }
}

const sseService = new SseService();
module.exports = sseService;

