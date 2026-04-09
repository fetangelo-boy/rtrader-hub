import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import HubNav from "@/components/HubNav";
import { vipData } from "@/data/vip";
import { useState } from "react";

const TG_URL = "https://t.me/RTrader11";

export default function Vip() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="neon-grid-bg min-h-screen text-white font-montserrat">
      {/* OLD NAV — для отката раскомментируй и убери HubNav */}
      <HubNav />

      <div className="pt-12 pb-16 container mx-auto px-4 max-w-5xl">
        {/* Hero */}
        <div className="text-center mb-14">
          <div
            className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #FF2D78, #9B30FF)",
              boxShadow: "0 0 40px rgba(255,45,120,0.4)",
            }}
          >
            <Icon name="Crown" size={36} className="text-white" />
          </div>
          <div className="text-xs text-white/30 uppercase tracking-widest mb-3">Закрытое комьюнити</div>
          <h1 className="font-russo text-3xl md:text-4xl text-white mb-4">{vipData.title}</h1>
          <p className="text-white/50 text-base max-w-xl mx-auto leading-relaxed">{vipData.description}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Link
              to={vipData.vipUrl}
              className="neon-btn px-8 py-3 text-sm font-bold"
              style={{ background: "linear-gradient(135deg, #FF2D78, #9B30FF)" }}
            >
              Вступить в VIP-клуб
            </Link>
            <a
              href={TG_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="neon-btn-outline px-8 py-3 text-sm"
            >
              Написать в Telegram
            </a>
          </div>
        </div>

        {/* Преимущества */}
        <div className="mb-12">
          <div className="text-xs text-white/30 uppercase tracking-widest font-semibold mb-6 text-center">
            Что входит в VIP
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {vipData.benefits.map((b, i) => (
              <div key={i} className="glass-card p-6 flex flex-col gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${b.accent}20`, border: `1px solid ${b.accent}30` }}
                >
                  <Icon name={b.icon} size={18} style={{ color: b.accent }} />
                </div>
                <h3 className="font-russo text-base text-white">{b.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{b.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="glass-card p-6 md:p-8 mb-8">
          <div className="text-xs text-white/30 uppercase tracking-widest font-semibold mb-6">Частые вопросы</div>
          <div className="flex flex-col gap-2">
            {vipData.faq.map((item, i) => (
              <div key={i} className="border border-white/8 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
                >
                  <span className="text-sm font-semibold text-white/80">{item.q}</span>
                  <Icon
                    name={openFaq === i ? "ChevronUp" : "ChevronDown"}
                    size={16}
                    className="text-white/40 flex-shrink-0 ml-4"
                  />
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-sm text-white/50 leading-relaxed border-t border-white/8 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA снизу */}
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: "linear-gradient(135deg, rgba(255,45,120,0.1), rgba(155,48,255,0.1))",
            border: "1px solid rgba(255,45,120,0.2)",
          }}
        >
          <h2 className="font-russo text-2xl text-white mb-3">Готов торговать на новом уровне?</h2>
          <p className="text-white/50 text-sm mb-6">Ограниченное количество мест в VIP-клубе.</p>
          <Link
            to={vipData.vipUrl}
            className="neon-btn px-10 py-3 text-sm font-bold inline-block"
            style={{ background: "linear-gradient(135deg, #FF2D78, #9B30FF)" }}
          >
            Вступить в VIP-клуб
          </Link>
        </div>
      </div>
    </div>
  );
}