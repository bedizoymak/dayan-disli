import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAllowed, setIsAllowed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      // Kullanıcının hedef sayfasını kaydet
      localStorage.setItem("auth_redirect_path", location.pathname);

      const { data: { session } } = await supabase.auth.getSession();

      // Oturum yoksa login'e yönlendir
      if (!session?.user?.email) {
        setIsAuthenticated(false);
        setIsAllowed(false);
        setLoading(false);
        return;
      }

      // Whitelist kontrolü
      const { data, error } = await (supabase.rpc as any)("is_email_allowed", {
        check_email: session.user.email,
      });

      if (error) {
        console.error("Whitelist kontrol hatası:", error);
        await supabase.auth.signOut();
        setIsAuthenticated(false);
        setIsAllowed(false);
        setLoading(false);
        return;
      }

      if (data === true) {
        setIsAuthenticated(true);
        setIsAllowed(true);
      } else {
        await supabase.auth.signOut();
        setIsAuthenticated(false);
        setIsAllowed(false);
      }

      setLoading(false);
    };

    checkAuth();
  }, [location.pathname]);

  if (loading) {
    return null; // burada bir skeleton veya spinner gösterilebilir
  }

  // Erişim yok → login sayfasına yönlendir
  if (!isAuthenticated || !isAllowed) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
