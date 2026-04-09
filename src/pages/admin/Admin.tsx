import { Routes, Route } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import AdminLogin from "./AdminLogin";
import AdminLayout from "./AdminLayout";
import AdminDashboard from "./AdminDashboard";
import AdminReviews from "./AdminReviews";
import AdminContent from "./AdminContent";
import CmsReflections from "./cms/CmsReflections";
import CmsAnalytics from "./cms/CmsAnalytics";
import CmsEducation from "./cms/CmsEducation";
import CmsTournaments from "./cms/CmsTournaments";
import CmsAuthor from "./cms/CmsAuthor";
import AdminActivityLog from "./AdminActivityLog";
import AdminSubscriptions from "./AdminSubscriptions";
import AdminStats from "./AdminStats";
import AdminPricing from "./AdminPricing";
import AdminBroadcast from "./AdminBroadcast";

export default function Admin() {
  const { isAuthed, login, logout, loading, error } = useAdminAuth();

  if (!isAuthed) {
    return <AdminLogin onLogin={(u, p) => login(u, p)} loading={loading} error={error} />;
  }

  return (
    <AdminLayout onLogout={logout}>
      <Routes>
        <Route index element={<AdminDashboard />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="content" element={<AdminContent />} />
        <Route path="cms/reflections" element={<CmsReflections />} />
        <Route path="cms/analytics" element={<CmsAnalytics />} />
        <Route path="cms/education" element={<CmsEducation />} />
        <Route path="cms/tournaments" element={<CmsTournaments />} />
        <Route path="cms/author" element={<CmsAuthor />} />
        <Route path="log" element={<AdminActivityLog />} />
        <Route path="subscriptions" element={<AdminSubscriptions />} />
        <Route path="stats" element={<AdminStats />} />
        <Route path="pricing" element={<AdminPricing />} />
        <Route path="broadcast" element={<AdminBroadcast />} />
      </Routes>
    </AdminLayout>
  );
}