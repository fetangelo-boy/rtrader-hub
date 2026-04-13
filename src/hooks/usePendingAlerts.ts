import { useState, useEffect, useRef, useCallback } from "react";
import { getAdminToken } from "@/hooks/useAdminAuth";

function playChime() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    const notes = [
      { freq: 523.25, start: 0,    dur: 0.35 },  // C5
      { freq: 659.25, start: 0.18, dur: 0.35 },  // E5
      { freq: 783.99, start: 0.36, dur: 0.5  },  // G5
      { freq: 1046.5, start: 0.54, dur: 0.7  },  // C6
    ];

    notes.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const pan = ctx.createStereoPanner();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.004, ctx.currentTime + start + dur);

      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);

      pan.pan.setValueAtTime((Math.random() - 0.5) * 0.3, ctx.currentTime + start);

      osc.connect(gain);
      gain.connect(pan);
      pan.connect(ctx.destination);

      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.05);
    });

    setTimeout(() => ctx.close(), 2000);
  } catch {
    // silent — браузер заблокировал AudioContext
  }
}

const API = "https://functions.poehali.dev/58c8224f-b1da-4e1a-9c7a-09bf808c3c47";
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
  const prevCountRef = useRef<number | null>(null);

  const toggleSound = useCallback(() => {
    setSoundEnabledState((prev) => {
      const next = !prev;
      localStorage.setItem(SOUND_KEY, String(next));
      return next;
    });
  }, []);

  const fetchPending = useCallback(async () => {
    const token = getAdminToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}?action=list`, {
        headers: { "Content-Type": "application/json", "X-Auth-Token": token },
      });
      const data = await res.json();
      const all: PendingEntry[] = (data.subscribers ?? []).filter(
        (s: { status: string }) => s.status === "pending"
      );
      setPending(all);

      const seen = getSeenIds();
      const freshIds = all
        .filter((s) => s.sub_id !== null && !seen.has(s.sub_id!))
        .map((s) => s.sub_id!);

      if (freshIds.length > 0) {
        setNewCount(freshIds.length);
        setShowBanner(true);
        if (getSoundEnabled()) playChime();
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