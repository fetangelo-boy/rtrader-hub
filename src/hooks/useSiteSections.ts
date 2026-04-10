import { useQuery } from "@tanstack/react-query";
import func2url from "../../backend/func2url.json";

const PUBLIC_CONTENT_URL = (func2url as Record<string, string>)["public-content"];

interface SiteSection {
  key: string;
  label: string;
  is_visible: boolean;
}

export function useSiteSections() {
  return useQuery<SiteSection[]>({
    queryKey: ["site-sections"],
    queryFn: async () => {
      const r = await fetch(`${PUBLIC_CONTENT_URL}?action=sections`);
      if (!r.ok) return [];
      const d = await r.json();
      return d.sections || [];
    },
    staleTime: 60_000,
  });
}