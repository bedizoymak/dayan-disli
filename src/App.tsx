import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Kargo from "./pages/Kargo";
import TeklifSayfasi from "./pages/TeklifSayfasi";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import Apps from "./pages/Apps";
import ProtectedRoute from "./components/ProtectedRoute";
import { CalculatorRoutes } from "./calculator";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Protected Routes */}
            <Route
              path="/apps"
              element={
                <ProtectedRoute>
                  <Apps />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kargo"
              element={
                <ProtectedRoute>
                  <Kargo />
                </ProtectedRoute>
              }
            />

            <Route
              path="/teklif-sayfasi"
              element={
                <ProtectedRoute>
                  <TeklifSayfasi />
                </ProtectedRoute>
              }
            />

            {/* Calculator Sub-App (Public) */}
            <Route path="/apps/calculator/*" element={<CalculatorRoutes />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
