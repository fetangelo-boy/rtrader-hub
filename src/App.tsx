import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";

import Index from "./pages/Index";
import Analytics from "./pages/Analytics";
import Reflections from "./pages/Reflections";
import ReflectionArticle from "./pages/ReflectionArticle";
import Tournaments from "./pages/Tournaments";
import Education from "./pages/Education";
import Reviews from "./pages/Reviews";
import Vip from "./pages/Vip";
import Community from "./pages/Community";
import PublicCommunity from "./pages/PublicCommunity";

import ClubIndex from "./pages/ClubIndex";
import AdminPanel from "./pages/admin/Admin";
import EditorPanel from "./pages/editor/Editor";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RestorePassword from "./pages/RestorePassword";
import Paywall from "./pages/Paywall";
import NoAccess from "./pages/NoAccess";
import ClubAdmin from "./pages/ClubAdmin";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function Spinner() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ClubRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, hasAccess, subLoading } = useAuth();
  if (loading || subLoading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!hasAccess) return <NoAccess />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "owner" && user.role !== "admin") return <Navigate to="/" replace />;
  return <>{children}</>;
}

function LoginRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, hasAccess, subLoading } = useAuth();
  if (loading || subLoading) return <Spinner />;
  if (!user) return <>{children}</>;
  if (hasAccess) return <Navigate to="/club" replace />;
  return <Navigate to="/subscribe" replace />;
}

function AuthedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Портал — публичный */}
      <Route path="/" element={<Index />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/reflections" element={<Reflections />} />
      <Route path="/reflections/:id" element={<ReflectionArticle />} />
      <Route path="/tournaments" element={<Tournaments />} />
      <Route path="/education" element={<Education />} />
      <Route path="/reviews" element={<Reviews />} />
      <Route path="/vip" element={<Vip />} />
      <Route path="/community" element={<PublicCommunity />} />

      {/* VIP-клуб */}
      <Route path="/club" element={<ClubRoute><ClubIndex /></ClubRoute>} />
      <Route path="/profile" element={<AuthedRoute><Profile /></AuthedRoute>} />
      <Route path="/subscribe" element={<AuthedRoute><Paywall /></AuthedRoute>} />
      <Route path="/admin" element={<AdminRoute><ClubAdmin /></AdminRoute>} />

      {/* Панель управления порталом */}
      <Route path="/rt-manage/*" element={<AdminPanel />} />

      {/* Редактор контента */}
      <Route path="/editor/*" element={<EditorPanel />} />

      {/* Авторизация */}
      <Route path="/login" element={<LoginRoute><Login /></LoginRoute>} />
      <Route path="/register" element={<LoginRoute><Register /></LoginRoute>} />
      <Route path="/restore-password" element={<RestorePassword />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
            <Toaster />
            <Sonner />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}