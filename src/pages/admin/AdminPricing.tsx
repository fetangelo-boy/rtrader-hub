import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Icon from "@/components/ui/icon";
import { getAdminToken } from "@/hooks/useAdminAuth";
import func2url from "../../../backend/func2url.json";
import { cn } from "@/lib/utils";

const PRICING_URL = (func2url as Record<string, string>)["admin-pricing"];

function authHeaders() {
  return { "X-Auth-Token": getAdminToken() || "", "Content-Type": "application/json" };
}

interface Plan {
  plan_key: string;
  name: string;
  price: number;
  days: number;
  is_active: boolean;
}

export default function AdminPricing() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saved, setSaved] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ plans: Plan[] }>({
    queryKey: ["admin-pricing"],
    queryFn: async () => {
      const r = await fetch(`${PRICING_URL}?action=list`, { headers: authHeaders() });
      return r.json();
    },
  });

  const updatePrice = useMutation({
    mutationFn: async ({ plan_key, price }: { plan_key: string; price: number }) => {
      const r = await fetch(`${PRICING_URL}?action=update`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ plan_key, price }),
      });
      return r.json();
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-pricing"] });
      setEditing(null);
      setSaved(vars.plan_key);
      setTimeout(() => setSaved(null), 2000);
    },
  });

  const togglePlan = useMutation({
    mutationFn: async ({ plan_key, is_active }: { plan_key: string; is_active: boolean }) => {
      const r = await fetch(`${PRICING_URL}?action=toggle`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ plan_key, is_active }),
      });
      return r.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-pricing"] }),
  });

  const handleSave = (plan_key: string) => {
    const price = parseInt(editValue);
    if (isNaN(price) || price < 0) return;
    updatePrice.mutate({ plan_key, price });
  };

  const plans = data?.plans || [];

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <div className="text-xs text-white/30 uppercase tracking-widest mb-1">Настройки</div>
        <h1 className="font-russo text-2xl text-white">Тарифы и цены</h1>
        <p className="text-white/40 text-sm mt-1">Изменения применяются сразу для новых заявок</p>
      </div>

      {isLoading ? (
        <div className="text-white/30 text-sm">Загрузка...</div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <div key={plan.plan_key}
              className={cn("glass-card p-4 flex items-center gap-4 transition-all", !plan.is_active && "opacity-50")}>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-white">{plan.name}</span>
                  <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded">{plan.days} дней</span>
                  {!plan.is_active && (
                    <span className="text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded">скрыт</span>
                  )}
                  {saved === plan.plan_key && (
                    <span className="text-xs text-green-400 flex items-center gap-1">
                      <Icon name="Check" size={11} /> Сохранено
                    </span>
                  )}
                </div>

                {editing === plan.plan_key ? (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1 bg-white/5 border border-neon-yellow/30 rounded-lg px-3 py-1.5">
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSave(plan.plan_key); if (e.key === "Escape") setEditing(null); }}
                        className="w-24 bg-transparent text-neon-yellow text-sm outline-none"
                        autoFocus
                      />
                      <span className="text-white/40 text-sm">₽</span>
                    </div>
                    <button onClick={() => handleSave(plan.plan_key)}
                      className="px-3 py-1.5 rounded-lg bg-neon-yellow/20 text-neon-yellow text-xs hover:bg-neon-yellow/30 transition-all">
                      Сохранить
                    </button>
                    <button onClick={() => setEditing(null)}
                      className="px-3 py-1.5 rounded-lg bg-white/5 text-white/40 text-xs hover:text-white/70 transition-all">
                      Отмена
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-russo text-neon-yellow">{plan.price.toLocaleString("ru")} ₽</span>
                    <button onClick={() => { setEditing(plan.plan_key); setEditValue(String(plan.price)); }}
                      className="text-white/20 hover:text-neon-yellow transition-colors">
                      <Icon name="Pencil" size={13} />
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => togglePlan.mutate({ plan_key: plan.plan_key, is_active: !plan.is_active })}
                className={cn("shrink-0 w-10 h-6 rounded-full border transition-all relative",
                  plan.is_active ? "bg-neon-yellow/30 border-neon-yellow/40" : "bg-white/5 border-white/10"
                )}>
                <div className={cn("absolute top-0.5 w-5 h-5 rounded-full transition-all",
                  plan.is_active ? "left-4 bg-neon-yellow" : "left-0.5 bg-white/30"
                )} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 rounded-xl bg-white/3 border border-white/8">
        <p className="text-xs text-white/30 leading-relaxed">
          Скрытый тариф не отображается пользователям при оформлении подписки, но уже выданные подписки этого тарифа остаются активными.
        </p>
      </div>
    </div>
  );
}
