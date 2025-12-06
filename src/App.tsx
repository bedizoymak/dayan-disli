import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";

import Index from "./pages/Index";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";

import ProtectedRoute from "./components/ProtectedRoute";

import Apps from "./pages/Apps";
import Kargo from "./pages/Kargo";
import TeklifSayfasi from "./features/quotation";
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

            {/* 🔓 Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* 🔒 Tüm diğer rotalar otomatik private */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Routes>
                    <Route path="apps" element={<Apps />} />
                    <Route path="apps/calculator/*" element={<CalculatorRoutes />} />
                    <Route path="kargo" element={<Kargo />} />
                    <Route path="teklif-sayfasi" element={<TeklifSayfasi />} />

                    {/* Yeni private sayfa eklersen sadece buraya eklemen yeterli */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </ProtectedRoute>
              }
            />

          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
