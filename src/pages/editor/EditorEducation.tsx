import EditorSection from "./EditorSection";

export default function EditorEducation() {
  return <EditorSection cfg={{
    id: "education",
    label: "Обучение",
    icon: "BookOpen",
    accentColor: "#00E5FF",
    path: "/education",
    titlePlaceholder: "Например: Управление капиталом: основы риск-менеджмента",
    previewPlaceholder: "Краткое описание урока или курса...",
    bodyPlaceholder: "Полный текст урока...",
    tags: ["Начинающим", "Продвинутым", "Технический анализ", "Психология", "Риск-менеджмент"],
  }} />;
}
