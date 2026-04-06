interface Props {
  options: string[];
  value: string;          // строка тегов через запятую
  onChange: (v: string) => void;
  accent?: string;
}

export default function TagSelect({ options, value, onChange, accent = "#9B30FF" }: Props) {
  const selected = value ? value.split(",").map(s => s.trim()).filter(Boolean) : [];

  const toggle = (tag: string) => {
    const next = selected.includes(tag)
      ? selected.filter(t => t !== tag)
      : [...selected, tag];
    onChange(next.join(", "));
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map(tag => {
        const active = selected.includes(tag);
        return (
          <button
            key={tag}
            type="button"
            onClick={() => toggle(tag)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
            style={{
              background: active ? `${accent}22` : "rgba(255,255,255,0.04)",
              borderColor: active ? `${accent}60` : "rgba(255,255,255,0.10)",
              color: active ? accent : "rgba(255,255,255,0.45)",
            }}
          >
            {active && <span className="mr-1">✓</span>}
            {tag}
          </button>
        );
      })}
      {selected.length > 0 && (
        <span className="text-xs text-white/25 self-center ml-1">
          Выбрано: {selected.join(", ")}
        </span>
      )}
    </div>
  );
}
