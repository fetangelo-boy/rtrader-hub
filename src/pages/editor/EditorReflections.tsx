import EditorSection from "./EditorSection";

export default function EditorReflections() {
  return <EditorSection cfg={{
    id: "reflections",
    label: "Рефлексии",
    icon: "Brain",
    accentColor: "#9B30FF",
    path: "/reflections",
    titlePlaceholder: "Например: Почему я потерял деньги, хотя был прав",
    previewPlaceholder: "Краткий анонс (2–3 предложения)...",
    bodyPlaceholder: "Полный текст рефлексии...",
    tags: ["Психология", "Дисциплина", "Эмоции", "Стратегия"],
  }} />;
}
