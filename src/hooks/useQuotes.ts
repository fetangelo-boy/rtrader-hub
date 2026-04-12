import { useQuery } from "@tanstack/react-query";
import func2url from "../../backend/func2url.json";

const QUOTES_URL = (func2url as Record<string, string>).quotes;

export interface Quote {
  name: string;
  price: string;
  change: string;
  up: boolean;
  raw_price: number;
  raw_change_pct: number;
}

export function useQuotes() {
  return useQuery<Quote[]>({
    queryKey: ["quotes"],
    queryFn: async () => {
      const r = await fetch(QUOTES_URL);
      const d = await r.json();
      return d.quotes || [];
    },
    refetchInterval: 120_000,
    staleTime: 115_000,
    refetchIntervalInBackground: false,
    placeholderData: [],
  });
}