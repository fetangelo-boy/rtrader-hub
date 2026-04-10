import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import func2url from "../../backend/func2url.json";

const PUBLIC_CONTENT_URL = (func2url as Record<string, string>)["public-content"];

const DOC_META: Record<string, { title: string; filename: string }> = {
  terms:   { title: "Пользовательское соглашение", filename: "rtrading-club-terms.txt" },
  privacy: { title: "Политика конфиденциальности", filename: "rtrading-club-privacy.txt" },
  rules:   { title: "Правила модерации", filename: "rtrading-club-rules.txt" },
};

export default function LegalDoc() {
  const { doc } = useParams<{ doc: string }>();
  const meta = DOC_META[doc ?? ""] ?? null;
  const [text, setText] = useState("");
  const [version, setVersion] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!meta) { setLoading(false); return; }
    fetch(`${PUBLIC_CONTENT_URL}?action=legal&doc=${doc}`)
      .then(r => r.json())
      .then(d => { setText(d.text || ""); setVersion(d.version || ""); })
      .finally(() => setLoading(false));
  }, [doc, meta]);

  const handleDownload = () => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = meta?.filename ?? "document.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!meta) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Документ не найден</p>
          <Link to="/" className="text-primary hover:underline text-sm">На главную</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-6 flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="ArrowLeft" size={18} />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-foreground">{meta.title}</h1>
            {version && <p className="text-xs text-muted-foreground mt-0.5">Версия {version}</p>}
          </div>
          <button
            onClick={handleDownload}
            disabled={!text || loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm font-medium hover:bg-primary/20 transition-all disabled:opacity-40"
          >
            <Icon name="Download" size={15} />
            Скачать
          </button>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Icon name="Loader2" size={16} className="animate-spin" /> Загружаю...
            </div>
          ) : (
            <pre className="whitespace-pre-wrap font-sans text-sm text-foreground/80 leading-relaxed">
              {text || "Текст документа временно недоступен."}
            </pre>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-4 justify-center text-xs text-muted-foreground">
          {Object.entries(DOC_META).map(([key, m]) => (
            key !== doc && (
              <Link key={key} to={`/legal/${key}`} className="hover:text-foreground transition-colors underline underline-offset-2">
                {m.title}
              </Link>
            )
          ))}
        </div>
      </div>
    </div>
  );
}
