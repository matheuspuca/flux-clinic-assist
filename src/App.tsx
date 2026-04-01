import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { GlobalHeader } from "@/components/GlobalHeader";
import { CommandPalette } from "@/components/CommandPalette";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import Professionals from "./pages/Professionals";
import Services from "./pages/Services";
import Appointments from "./pages/Appointments";
import Inventory from "./pages/Inventory";
import Financial from "./pages/Financial";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Onboarding from "./pages/Onboarding";
import ResetPassword from "./pages/ResetPassword";
import Users from "./pages/Users";
import Patients from "./pages/Patients";
import ChatbotLogs from "./pages/ChatbotLogs";
import SettingsPage from "./pages/Settings";
import Profile from "./pages/Profile";
import SuperAdmin from "./pages/SuperAdmin";
import NotFound from "./pages/NotFound";
import { Chatbot } from "./components/Chatbot";
import { ImpersonationBanner } from "./components/ImpersonationBanner";

const queryClient = new QueryClient();

const DashboardLayout = ({ children }: { children: React.ReactNode }) => (
  <SidebarProvider>
    <ImpersonationBanner />
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <GlobalHeader />
        <div className="overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
    <CommandPalette />
  </SidebarProvider>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user && profile && !profile.clinic_id) return <Navigate to="/onboarding" replace />;

  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (user && profile?.clinic_id) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/onboarding" element={
      <ProtectedRoute><Onboarding /></ProtectedRoute>
    } />
    {[
      { path: "/dashboard", element: <Dashboard /> },
      { path: "/professionals", element: <Professionals /> },
      { path: "/services", element: <Services /> },
      { path: "/appointments", element: <Appointments /> },
      { path: "/patients", element: <Patients /> },
      { path: "/inventory", element: <Inventory /> },
      { path: "/financial", element: <Financial /> },
      { path: "/users", element: <Users /> },
      { path: "/chatbot-logs", element: <ChatbotLogs /> },
      { path: "/settings", element: <SettingsPage /> },
      { path: "/profile", element: <Profile /> },
      { path: "/superadmin", element: <SuperAdmin /> },
    ].map(({ path, element }) => (
      <Route key={path} path={path} element={
        <ProtectedRoute>
          <DashboardLayout>{element}</DashboardLayout>
        </ProtectedRoute>
      } />
    ))}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Chatbot />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
