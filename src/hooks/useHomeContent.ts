import { useQuery } from "@tanstack/react-query";
import func2url from "../../backend/func2url.json";

const PUBLIC_CONTENT_URL = (func2url as Record<string, string>)["public-content"];

interface HomeContent {
  hero_title: string;
  hero_subtitle: string;
  stats_members: string;
  stats_years: string;
  stats_materials: string;
}

const DEFAULTS: HomeContent = {
  hero_title: "RTrader — трейдинговый портал",
  hero_subtitle: "Для того, кто хочет понимать рынок, расти в трейдинге, принимать осознанные решения и зарабатывать без иллюзий «лёгких денег».",
  stats_members: "2 500+",
  stats_years: "7 лет",
  stats_materials: "200+",
};

export function useHomeContent() {
  return useQuery<HomeContent>({
    queryKey: ["home-content"],
    queryFn: async () => {
      const r = await fetch(`${PUBLIC_CONTENT_URL}?action=content&section=home`);
      if (!r.ok) return DEFAULTS;
      const d = await r.json();
      const items: { key: string; value: string }[] = d.content || [];
      const result = { ...DEFAULTS };
      for (const item of items) {
        if (item.key in result) {
          (result as Record<string, string>)[item.key] = item.value;
        }
      }
      return result;
    },
    staleTime: 60_000,
  });
}
