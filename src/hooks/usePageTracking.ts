import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import func2url from "../../backend/func2url.json";

const STATS_URL = (func2url as Record<string, string>)["admin-stats"];

function getSessionId(): string {
  const key = "rt_sid";
  let sid = sessionStorage.getItem(key);
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(key, sid);
  }
  return sid;
}

export function usePageTracking(userId?: number | null) {
  const location = useLocation();

  useEffect(() => {
    const sid = getSessionId();
    fetch(`${STATS_URL}?action=track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sid, page: location.pathname, user_id: userId ?? null }),
    }).catch(() => {});
  }, [location.pathname, userId]);
}
