/**
 * 🚨 HỆ THỐNG CẢNH BÁO TÁC CHIẾN ĐÔ THỊ THÔNG MINH (IOC URBAN EMERGENCY ALERT)
 * - Mức 3: Web Audio API Dual-Tone Siren (Còi hú tần số kép 600Hz <-> 900Hz không cần tải file ngoài)
 * - Mức 3: Web Push Notification (Thông báo đẩy trên màn hình khóa điện thoại / desktop)
 */

const SIREN_STORAGE_KEY = 'urbantree_siren_sound_enabled';

// Kiểm tra trạng thái bật/tắt còi hú trong localStorage (mặc định BẬT)
export function isSirenSoundEnabled(): boolean {
  try {
    const val = localStorage.getItem(SIREN_STORAGE_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

// Cài đặt trạng thái bật/tắt còi hú
export function setSirenSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(SIREN_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch (e) {
    console.warn('Cannot write siren sound setting to localStorage', e);
  }
}

// Phát âm thanh còi hú tác chiến tần số kép (Dual-tone emergency siren)
// 600Hz <-> 900Hz quét lặp chuẩn xe ưu tiên / cứu hộ đô thị
export function playEmergencySirenSound(durationSeconds: number = 2.4): void {
  if (!isSirenSoundEnabled()) return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    const sweepCount = Math.max(1, Math.floor(durationSeconds / 0.6));

    // Quét tần số 600Hz -> 900Hz -> 600Hz liên tục
    for (let i = 0; i < sweepCount; i++) {
      const t = now + i * 0.6;
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.linearRampToValueAtTime(920, t + 0.3);
      osc.frequency.linearRampToValueAtTime(600, t + 0.6);
    }

    // Âm lượng vừa phải (0.12), fade out nhẹ ở cuối
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.setValueAtTime(0.12, now + durationSeconds - 0.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);

    osc.start(now);
    osc.stop(now + durationSeconds);

    // Tự động giải phóng AudioContext
    setTimeout(() => {
      try {
        ctx.close();
      } catch {}
    }, (durationSeconds + 0.5) * 1000);
  } catch (err) {
    // Trình duyệt có thể chặn autoplay âm thanh nếu người dùng chưa tương tác lần đầu
    console.warn('Audio Siren autoplay prevented by browser policy:', err);
  }
}

// Phát âm thanh xác nhận nhận lệnh (Success / Beep chirp)
export function playDispatchConfirmChirp(): void {
  if (!isSirenSoundEnabled()) return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
    osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.start(now);
    osc.stop(now + 0.35);
    setTimeout(() => ctx.close().catch(() => {}), 500);
  } catch {}
}

// Kích hoạt Web Push Notification (Thông báo đẩy của hệ thống trình duyệt / PWA)
export async function sendWebPushNotification(title: string, options?: NotificationOptions): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Trình duyệt không hỗ trợ Web Notification API');
    return false;
  }

  try {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'urbantree-alert',
        ...options,
      });
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'urbantree-alert',
          ...options,
        });
        return true;
      }
    }
  } catch (err) {
    console.warn('Không thể gửi Web Push Notification:', err);
  }

  return false;
}

