import EditorSection from "./EditorSection";

export default function EditorAnalytics() {
  return <EditorSection cfg={{
    id: "analytics",
    label: "Аналитика",
    icon: "TrendingUp",
    accentColor: "#FFD700",
    path: "/analytics",
    titlePlaceholder: "Например: Золото — ключевые уровни на неделю",
    previewPlaceholder: "Краткое описание аналитики...",
    bodyPlaceholder: "Полный разбор: уровни, сигналы, рекомендации...",
    tags: ["Золото", "Нефть", "Акции", "Крипто", "Форекс", "Индексы"],
  }} />;
}
