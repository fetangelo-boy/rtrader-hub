import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import EditorLayout from "./EditorLayout";
import EditorReflections from "./EditorReflections";
import EditorAnalytics from "./EditorAnalytics";
import EditorEducation from "./EditorEducation";
import EditorTournaments from "./EditorTournaments";

export default function Editor() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || (user.role !== "editor" && user.role !== "owner" && user.role !== "admin")) {
    return <Navigate to="/login" replace />;
  }

  return (
    <EditorLayout>
      <Routes>
        <Route index element={<Navigate to="reflections" replace />} />
        <Route path="reflections" element={<EditorReflections />} />
        <Route path="analytics" element={<EditorAnalytics />} />
        <Route path="education" element={<EditorEducation />} />
        <Route path="tournaments" element={<EditorTournaments />} />
      </Routes>
    </EditorLayout>
  );
}
