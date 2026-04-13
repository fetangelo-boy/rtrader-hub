import { useState, useEffect, useRef, useCallback } from "react";
import { getAdminToken } from "@/hooks/useAdminAuth";

const API = "https://functions.poehali.dev/58c8224f-b1da-4e1a-9c7a-09bf808c3c47";
const POLL_INTERVAL = 30_000;
const SEEN_KEY = "admin_seen_pending_ids";

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
  const prevCountRef = useRef<number | null>(null);

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

  return { pending, totalPending, newCount, showBanner, dismissBanner };
}
