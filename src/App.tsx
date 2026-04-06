import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import ClubIndex from "./pages/ClubIndex";
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

function PrivateRoute({ children }: { children: React.ReactNode }) {
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

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? <Navigate to="/" replace /> : <>{children}</>;
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
      <Route path="/" element={<PrivateRoute><ClubIndex /></PrivateRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/restore-password" element={<PublicRoute><RestorePassword /></PublicRoute>} />
      <Route path="/subscribe" element={<AuthedRoute><Paywall /></AuthedRoute>} />
      <Route path="/admin" element={<AdminRoute><ClubAdmin /></AdminRoute>} />
      <Route path="/profile" element={<AuthedRoute><Profile /></AuthedRoute>} />
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
