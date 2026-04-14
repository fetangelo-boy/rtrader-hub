import { useState, useEffect, useRef, useCallback } from "react";
import { getAdminToken } from "@/hooks/useAdminAuth";
import func2url from "../../backend/func2url.json";

// Короткий WAV-файл колокольчика в base64 (генерируется через Web Audio при первом клике)
let _unlocked = false;

function playChime() {
  try {
    type WinWithWebkit = Window & { webkitAudioContext?: typeof AudioContext };
    const AC = window.AudioContext || (window as WinWithWebkit).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();

    const notes = [
      { freq: 523.25, start: 0,    dur: 0.35 },
      { freq: 659.25, start: 0.18, dur: 0.35 },
      { freq: 783.99, start: 0.36, dur: 0.5  },
      { freq: 1046.5, start: 0.54, dur: 0.7  },
    ];

    notes.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.05);
    });

    setTimeout(() => ctx.close(), 2500);
  } catch {
    // silent
  }
}

// Разблокируем возможность воспроизведения при первом клике
if (typeof window !== "undefined") {
  const unlock = () => { _unlocked = true; };
  window.addEventListener("click", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });
  window.addEventListener("touchstart", unlock, { once: true });
}

export function testChime() {
  _unlocked = true;
  playChime();
}

const API = (func2url as Record<string, string>)["admin"];
const POLL_INTERVAL = 30_000;
const SEEN_KEY = "admin_seen_pending_ids";
const SOUND_KEY = "admin_sound_enabled";

function getSoundEnabled(): boolean {
  try {
    const v = localStorage.getItem(SOUND_KEY);
    return v === null ? true : v === "true";
  } catch {
    return true;
  }
}

function getSeenIds(): Set<number> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveSeenIds(ids: Set<number>) {
  localStorage.setItem(SEEN_KEY, JSON.stringify([...ids]));
}

export interface PendingEntry {
  user_id: number;
  nickname: string;
  email: string;
  sub_id: number | null;
  plan: string | null;
  created_at: string | null;
}

export function usePendingAlerts() {
  const [pending, setPending] = useState<PendingEntry[]>([]);
  const [newCount, setNewCount] = useState(0);
  const [showBanner, setShowBanner] = useState(false);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(getSoundEnabled);
  const soundEnabledRef = useRef<boolean>(getSoundEnabled());
  const prevCountRef = useRef<number | null>(null);

  const toggleSound = useCallback(() => {
    setSoundEnabledState((prev) => {
      const next = !prev;
      soundEnabledRef.current = next;
      localStorage.setItem(SOUND_KEY, String(next));
      return next;
    });
  }, []);

  const isFirstFetch = useRef(true);

  const fetchPending = useCallback(async () => {
    const token = getAdminToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}?action=subscribers&status=pending`, {
        headers: { "Content-Type": "application/json", "X-Auth-Token": token },
      });
      const data = await res.json();
      const all: PendingEntry[] = data.subscribers ?? [];
      setPending(all);

      const seen = getSeenIds();
      const freshIds = all
        .filter((s) => s.sub_id !== null && !seen.has(s.sub_id!))
        .map((s) => s.sub_id!);

      if (isFirstFetch.current) {
        // При первом запросе — просто запоминаем всё как виденное, без звука
        // (они уже были до открытия вкладки)
        isFirstFetch.current = false;
        const seen2 = getSeenIds();
        all.forEach((s) => { if (s.sub_id) seen2.add(s.sub_id); });
        saveSeenIds(seen2);
        setNewCount(0);
      } else if (freshIds.length > 0) {
        // Новые заявки появились во время сессии — показываем и играем
        setNewCount(freshIds.length);
        setShowBanner(true);
        if (soundEnabledRef.current && _unlocked) playChime();
      } else if (prevCountRef.current !== null && all.length !== prevCountRef.current) {
        setNewCount(0);
      }

      prevCountRef.current = all.length;
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchPending();
    const id = setInterval(fetchPending, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchPending]);

  const dismissBanner = useCallback(() => {
    setShowBanner(false);
    const seen = getSeenIds();
    pending.forEach((s) => { if (s.sub_id) seen.add(s.sub_id); });
    saveSeenIds(seen);
    setNewCount(0);
  }, [pending]);

  const totalPending = pending.length;

  return { pending, totalPending, newCount, showBanner, dismissBanner, soundEnabled, toggleSound };
}