export default function MiniFooter() {
  return (
    <div className="w-full border-t border-white/5 py-3 px-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/20">
        <span>© 2026 RTrader. Все права защищены.</span>
        <a
          href="#"
          title="Скоро"
          className="inline-flex items-center gap-1.5 text-white/20 hover:text-white/40 transition-colors cursor-default select-none"
          onClick={e => e.preventDefault()}
        >
          <span className="w-1 h-1 rounded-full bg-white/15 inline-block" />
          Traders Reflections
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/8 text-white/15 font-medium tracking-wide">
            soon
          </span>
        </a>
      </div>
    </div>
  );
}
