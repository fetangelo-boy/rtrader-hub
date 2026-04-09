import EditorSection from "./EditorSection";

export default function EditorTournaments() {
  return <EditorSection cfg={{
    id: "tournaments",
    label: "Конкурсы",
    icon: "Trophy",
    accentColor: "#FF8C00",
    path: "/tournaments",
    titlePlaceholder: "Например: Конкурс прогнозов — Золото, апрель 2026",
    previewPlaceholder: "Краткое описание конкурса...",
    bodyPlaceholder: "Полные условия конкурса, призы, правила...",
    tags: ["Активный", "Завершён", "Предстоящий"],
  }} />;
}
