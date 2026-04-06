import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { educationData } from "@/data/education";

const TG_URL = "https://t.me/RTrader11";
const VIP_URL = "https://web-app-hosting--preview.poehali.dev/login";

export default function Education() {
  return (
    <div className="neon-grid-bg min-h-screen text-white font-montserrat">
      {/* NAV */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-black/70 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg brand-gradient-bg flex items-center justify-center shadow-lg">
              <span className="font-russo text-black text-sm font-black">RT</span>
            </div>
            <span className="font-russo text-xl tracking-wider">
              R<span className="brand-gradient">TRADER</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-white/50 hover:text-white text-sm transition-colors flex items-center gap-1.5">
              <Icon name="ArrowLeft" size={14} /> На главную
            </Link>
            <a href={VIP_URL} target="_blank" rel="noopener noreferrer" className="neon-btn text-xs px-4 py-2">
              VIP-доступ
            </a>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-16 container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4169FF] to-[#9B30FF] flex items-center justify-center shadow-lg">
              <Icon name="BookOpen" size={22} className="text-white" />
            </div>
            <div>
              <div className="text-xs text-white/30 uppercase tracking-widest font-semibold">Раздел</div>
              <h1 className="font-russo text-2xl md:text-3xl text-white">{educationData.title}</h1>
            </div>
          </div>
          <p className="text-white/50 text-sm leading-relaxed max-w-2xl">{educationData.description}</p>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {educationData.stats.map((s, i) => (
            <div key={i} className="glass-card p-4 text-center">
              <div className="font-russo text-2xl text-white mb-1">{s.val}</div>
              <div className="text-xs text-white/35">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Модули */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {educationData.modules.map((module) => (
            <div
              key={module.id}
              className="glass-card p-6 flex flex-col gap-4 hover:border-white/20 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-russo text-base flex-shrink-0"
                    style={{
                      background: `${module.accent}15`,
                      border: `1px solid ${module.accent}30`,
                      color: module.accent,
                    }}
                  >
                    {module.number}
                  </div>
                  <div>
                    <h3 className="font-russo text-base text-white leading-tight">{module.title}</h3>
                    <div className="text-xs text-white/30 mt-0.5">{module.level}</div>
                  </div>
                </div>
                {module.free ? (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 border border-green-500/30 font-semibold flex-shrink-0">
                    Бесплатно
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/25 font-semibold flex-shrink-0">
                    VIP
                  </span>
                )}
              </div>

              <p className="text-white/45 text-sm leading-relaxed">{module.description}</p>

              <div className="flex flex-col gap-1.5">
                {module.topics.map((topic, j) => (
                  <div key={j} className="flex items-center gap-2 text-xs text-white/50">
                    <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: module.accent }} />
                    {topic}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/8">
                <div className="flex items-center gap-3 text-xs text-white/30">
                  <span className="flex items-center gap-1">
                    <Icon name="PlayCircle" size={12} /> {module.lessons} уроков
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="Clock" size={12} /> {module.duration}
                  </span>
                </div>
                {module.free ? (
                  <a
                    href={TG_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold flex items-center gap-1"
                    style={{ color: module.accent }}
                  >
                    Начать <Icon name="ArrowRight" size={11} />
                  </a>
                ) : (
                  <a
                    href={VIP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold flex items-center gap-1 text-[#FFD700]"
                  >
                    VIP-доступ <Icon name="Lock" size={11} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="glass-card p-8 text-center">
          <div className="text-xs text-white/30 uppercase tracking-widest mb-2">Полный курс</div>
          <h2 className="font-russo text-xl text-white mb-3">Получи доступ ко всем модулям</h2>
          <p className="text-white/45 text-sm mb-6 max-w-md mx-auto">
            Модули 3–6 доступны участникам VIP-клуба. Первые два модуля — бесплатно в Telegram.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/vip" className="neon-btn px-6 py-2.5 text-sm">
              VIP-клуб RTrader
            </Link>
            <a href={TG_URL} target="_blank" rel="noopener noreferrer" className="neon-btn-outline px-6 py-2.5 text-sm">
              Бесплатные материалы
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
