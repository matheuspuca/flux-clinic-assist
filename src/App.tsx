import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Dashboard from "./pages/Dashboard";
import Professionals from "./pages/Professionals";
import Services from "./pages/Services";
import Appointments from "./pages/Appointments";
import Financial from "./pages/Financial";
import NotFound from "./pages/NotFound";
import { Chatbot } from "./components/Chatbot";

const queryClient = new QueryClient();

const DashboardLayout = ({ children }: { children: React.ReactNode }) => (
  <SidebarProvider>
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      <main className="flex-1">
        <div className="h-12 flex items-center border-b border-border bg-background">
          <SidebarTrigger className="ml-4" />
        </div>
        {children}
      </main>
    </div>
  </SidebarProvider>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          } />
          <Route path="/professionals" element={
            <DashboardLayout>
              <Professionals />
            </DashboardLayout>
          } />
          <Route path="/services" element={
            <DashboardLayout>
              <Services />
            </DashboardLayout>
          } />
          <Route path="/appointments" element={
            <DashboardLayout>
              <Appointments />
            </DashboardLayout>
          } />
          <Route path="/financial" element={
            <DashboardLayout>
              <Financial />
            </DashboardLayout>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Chatbot />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
