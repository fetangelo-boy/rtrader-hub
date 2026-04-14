import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import func2url from "../../backend/func2url.json";

const STATS_URL = (func2url as Record<string, string>)["admin-stats"];

function getSessionId(): string {
  let id = sessionStorage.getItem("_sid");
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem("_sid", id);
  }
  return id;
}

export function usePageView(userId?: number | null) {
  const location = useLocation();

  useEffect(() => {
    const session_id = getSessionId();
    fetch(`${STATS_URL}?action=track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id, path: location.pathname, user_id: userId ?? null }),
    }).catch(() => {});
  }, [location.pathname, userId]);
}
