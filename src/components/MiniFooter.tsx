export default function MiniFooter() {
  return (
    <div className="w-full border-t border-white/8 py-3 px-4"
      style={{ background: "linear-gradient(to right, rgba(255,45,120,0.04) 0%, rgba(155,48,255,0.04) 50%, rgba(0,229,255,0.04) 100%)" }}>
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <span className="text-xs font-medium"
          style={{ background: "linear-gradient(90deg, #FF2D78, #9B30FF, #00E5FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          © 2026 RTrader. Все права защищены.
        </span>
        <a
          href="#"
          title="Скоро"
          className="inline-flex items-center gap-1.5 transition-opacity cursor-default select-none opacity-60 hover:opacity-90"
          onClick={e => e.preventDefault()}
        >
          <span className="w-1.5 h-1.5 rounded-full inline-block"
            style={{ background: "linear-gradient(135deg, #FF2D78, #9B30FF)" }} />
          <span className="text-xs font-medium text-white/70">Traders Reflections</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold tracking-widest uppercase"
            style={{ background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.2)", color: "#00E5FF" }}>
            soon
          </span>
        </a>
      </div>
    </div>
  );
}
