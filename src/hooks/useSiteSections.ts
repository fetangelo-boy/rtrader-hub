import { useQuery } from "@tanstack/react-query";

const CONTENT_URL = "https://functions.poehali.dev/f7bd41c1-8acb-4ad3-8af1-19514ba3f94c";

interface SiteSection {
  key: string;
  label: string;
  is_visible: boolean;
}

export function useSiteSections() {
  return useQuery<SiteSection[]>({
    queryKey: ["site-sections"],
    queryFn: async () => {
      const r = await fetch(`${CONTENT_URL}?action=sections`);
      if (!r.ok) return [];
      const d = await r.json();
      return d.sections || [];
    },
    staleTime: 60_000,
  });
}
